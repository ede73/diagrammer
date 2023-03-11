#!/bin/bash
[ "$1" = "SELFTEST" ] && {
  # Self-test:
  [ "$(whoami)" = "root" ] && {
    echo "Do be root, use sudo"
  }

  KEEP=0
  [ "$2" == "keep" ] && {
    KEEP=1
    shift
  }
  BOOTDIR=${2:-/tmp/diagrammer_selftest_chroot_$$}
  EXTERNAL_SOURCES=/tmp/diagrammer_external_sources
  TEST_USER=testuser

  [ ! -d "${EXTERNAL_SOURCES}" ] && {
    git clone git@github.com:ede73/diagrammer.git "${EXTERNAL_SOURCES}/diagrammer"
    git clone git@github.com:ede73/blockdiag.git "${EXTERNAL_SOURCES}/blockdiag"
    for diag in act nw seq; do
      git clone https://github.com/blockdiag/${diag}diag.git "${EXTERNAL_SOURCES}/${diag}diag"
    done
  }

  [ ! -d "${BOOTDIR}" ] && {
    echo bootstrapping
    sudo debootstrap stable "${BOOTDIR}"
  }
  sudo mount --bind /proc "${BOOTDIR}/proc"
  sudo chroot "${BOOTDIR}" sh -c "apt-get update; apt-get install -y sudo curl"
  # On Ubuntu, node versions are always ANCIENT, get modern one! (nodejs installed later with make in general setup)
  sudo chroot "${BOOTDIR}" sh -c "curl -fsSL https://deb.nodesource.com/setup_18.x | bash -"
  # Trouble getting puppeteer running headless chrome, a LOT of unmet dependencies (this'll take a moment)
  sudo chroot "${BOOTDIR}" apt -qq install -y pip libgtk-3-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 chromium-common chromium
  # Oh boy, really need to go the LONG route here...~root jest/puppeteer just wont work as root
  sudo chroot "${BOOTDIR}" sh -c "echo -e '\n\n\n' | adduser --disabled-password --quiet $TEST_USER"
  sudo chroot "${BOOTDIR}" sh -c "echo '$TEST_USER ALL=(ALL) NOPASSWD: ALL' |tee /etc/sudoers.d/$TEST_USER"

  mkdir "${BOOTDIR}/home/$TEST_USER/diagrammer_external_sources"
  sudo mount --bind "${EXTERNAL_SOURCES}" "${BOOTDIR}/home/$TEST_USER/diagrammer_external_sources"
  sudo chroot "${BOOTDIR}" sh -c "chown -R ${TEST_USER}:${TEST_USER} /home/${TEST_USER}"
  sudo chroot "${BOOTDIR}" sh -c "ln -rs /home/$TEST_USER/diagrammer_external_sources/diagrammer /home/$TEST_USER/diagrammer"
  # Also puppeteer/chromium doesnt support running as root with sandbox
  cat >"${BOOTDIR}/home/$TEST_USER/diagrammer/jest-puppeteer.config.cjs" <<EOF
module.exports = {
  launch: {
    dumpio: false,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
};
EOF
  sudo chroot "${BOOTDIR}" sh -c "su -c 'cd /home/$TEST_USER/diagrammer;scripts/setup.sh YES_TO_ALL' - $TEST_USER"
  RC=$?
  if [ $RC -eq 0 ]; then
    if [ $KEEP -ne 0 ]; then
      echo "Asked to keep the residual files"
      echo "Renter selftest:"
      echo " scripts/setup.sh SELFTEST keep $BOOTDIR"
      echo "Or go examine the chroot:"
      echo " sudo chroot $BOOTDIR"
      exit 0
    fi
    sudo umount "${BOOTDIR}/proc"
    sudo umount "${BOOTDIR}/home/$TEST_USER/diagrammer_external_sources"
    sudo rm -fR "${BOOTDIR}"
    rm -fR "${EXTERNAL_SOURCES}"
    echo "Tests completed, all changes removed"
    exit 0
  else
    echo "Something went wrong while testing"
    echo "sudo chroot ${BOOTDIR} su - $TEST_USER"
    echo "JEST_PUPPETEER_CONFIG=jest-puppeteer.config.cjs npm test"
    exit 10
  fi

  # had to try all sorts of tricks to get headless chrome working on puppeteer
  #JEST_PUPPETEER_CONFIG=jest-puppeteer.config.cjs npm test tests/model/graphedge.test.js
  # find . -type d | xargs -L1 -Ixx chmod 755 xx;find . -type f -perm /u+x | xargs -L1 -Ixx chmod 755 xx;find . -type f -not -perm /u+x | xargs -L1 -Ixx chmod 644 xx
  # also just installing the chrome
  #sudo mount --bind /proc $BOOTDIR/proc
  #module.exports = {
  #launch: {
  #  dumpio: false,
  #  headless: true,
  #  args: ['--no-sandbox', '--disable-setuid-sandbox']
  #}
  #};
}

# USE AT OWN RISK! Haven't run in a while...
[ -d web ] && [ -d ace ] && [ -d css ] && [ -d generators ] && [ -d model ] || {
  echo "Run this is diagrammer folder..."
  exit 10
}

YES_TO_ALL=${1:-}

# This script requires sudo to install

confirm() {
  affirmative="$1"
  shift
  [ "$YES_TO_ALL" = "YES_TO_ALL" ] && {
    $affirmative
    return 0
  }
  read -r -p "$* [y/N] " response 2>/dev/tty
  case "$response" in
  [yY][eE][sS] | [yY])
    $affirmative
    return 0
    ;;
  *)
    return 1
    ;;
  esac
}

error() {
  echo >&2 "ERROR: $*"
}

warning() {
  echo >&2 "WARNING: $*"
}

OSTYPE=$(uname | tr '[:upper:]' '[:lower:]')

install() {
  case $OSTYPE in
  darwin*)
    brew install $*
    ;;
  linux*)
    sudo apt -qq -y install $*
    ;;
  *)
    error "Unknown architecture ($OSTYPE) - no package install command"
    exit 10
    ;;
  esac
}

install_diags() {
  # case $OSTYPE in
  # linux*)
  #   # TODO: Pull and install from my repo (these dont support stdout redirect!)
  #   install python3-nwdiag python3-blockdiag python3-actdiag python3-seqdiag
  #   ;;
  # *)
  #   error "Unsupported platform $OSTYPE, install nwdiag, blockdiag, actdiag, seqdiags manually"
  #   ;;
  # esac
  # Need to build the diags

  for diag in blockdiag nwdiag actdiag seqdiag; do
    cd ~/diagrammer_external_sources/$diag
    sudo pip install .
  done
  cd
}

install_plantuml() {
  cd ~/diagrammer
  install plantuml

  PLANT_JAR=$(dpkg -L plantuml | grep .jar)
  cp $PLANT_JAR ext/

  install default-jre-headless

  # uh oh, rasp zero is armv6 and openjdk-11 doesn't provide armv6 compatible build (openjdk11 is default)
  uname -m | grep armv6 && {
    install openjdk-8-jdk
    # this may not be enuf, might need to set as default, as jdk11 installs anyway(as it seems)
    # but it solved the Vm (armv6 not supported) issue on ca-certificates-java
  }
}

install_graphviz() {
  # Note MAC brew install graphviz --with-pango
  install graphviz
}

install_mscgen() {
  install mscgen
}

npm_install() {
  (
    cd ~/diagrammer
    npm i
  )
}

install_nodejs() {
  # On Ubuntu, nodejs is ANCIENT, hack required to install modern one, alas creating conflicts with npm for apt
  # how ever both will get installed
  install nodejs make
  [ ! $(command -v npm) ] && {
    install npm
  }
  confirm npm_install "Run npm i? You can do it manually later also..."
}

run_tests() {
  cd ~/diagrammer
  # New bug in ubuntu? setup? Anyway, puppeteer refused to run with no clear error
  # chromium --headless pointed out cannot access /dev/shm, suggested solution is chmod below
  sudo chmod 1777 /dev/shm
  # Fixed that one issue, but puppeteer still will not go...
  # https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md
  # no-sandbox option seems to work.. but that sounds just so wrong...
  # [0311/191338.674081:FATAL:zygote_host_impl_linux.cc(127)] No usable sandbox! Update your kernel or see https://chromium.googlesource.com/chromium/src/+/main/docs/linux/suid_sandbox_development.md for more information on developing with the SUID sandbox. If you want to live dangerously and need an immediate workaround, you can try using --no-sandbox.
  # Something changes in the ubuntu setup since last run (few weeks ago :( )
  # OK, this works, specifying the chromium sandbox specifically
  export CHROME_DEVEL_SANDBOX=$(dpkg -L chromium-sandbox | grep chrome-sandbox)
  # TODO: allow miniserver to have it's own local port (easy heare, but need to change the web/backend and web/visualize + tests)
  # all have hardcoded localhost:8000
  make
  node web/miniserver.js &
  set -e
  JEST_PUPPETEER_CONFIG=jest-puppeteer.config.cjs make test
  pkill -f miniserver
}

install_typescript() {
  sudo npm install -g typescript
}

cat <<EOF
NOTICE!

If you plan to use the WWW frontend, you need a web server! Any will do. There's web/miniserver.js.

Some renderers require backend rendering even with WWW front (plantuml sequence, [act|block|nw|seq]diags).

On the other hand, if you only plan to use the command line rendering capabilities, there's no need to webserver. Depending on your graphing needs, you may still require those renderers!

Graphviz can be rendered on WWW/javascript only (excluding sfdp).

Also some renderers are only available via WWW (D3.js, GoJS)

Command line rendering required NodeJS, but WWW relies on many rendering packages via NodeJS. Yes, there are online CDN for these, but for development needs, these are not used.
EOF

confirm install_graphviz "[OPTIONAL!] Install graphviz?"
confirm install_diags "[OPTIONAL!] Do you want to install nwdiag, blockdiag, actdiag, seqdiag?"
confirm install_mscgen "[OPTIONAL!] Do you want to install mscgen?"
confirm install_plantuml "[OPTIONAL!] Do you want to install plantuml?"
confirm install_nodejs "[Required!] Do you want to install nodejs and npm?"
confirm install_typescript "[Required!] tsc(Typescript) is required to transpile, install (will use npm -g)?"
echo "If you installed renderers, nodejs and its modules, you can now run the test suite to verify all works as expected"
confirm run_tests "[Optional!] Run tests?"

#Also requires is typescript?
