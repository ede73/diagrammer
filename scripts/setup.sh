#!/bin/bash
[ "$1" = "SELFTEST" ] && {
  # Self-test:
  [ "$(whoami)" != "root" ] && {
    echo "Need to be root to run selftest (bootstrap requirement)"
    exit 10
  }

  # shut down local apache (so it will not mess with the tests)
  apache2ctl stop

  BOOTDIR=/tmp/stable_ubuntu
  DIAGRAMMER_SOURCE=selftest

  [ ! -d "${DIAGRAMMER_SOURCE}" ] && {
    git clone git@github.com:ede73/diagrammer.git diagrammer.git "${DIAGRAMMER_SOURCE}"
  }

  [ ! -d "${BOOTDIR}" ] && {
    echo bootstrapping
    debootstrap stable "${BOOTDIR}"
  }
  mount --bind /proc "${BOOTDIR}/proc"
  #cp -fR selftest "${BOOTDIR}/selftest"
  chroot "${BOOTDIR}" apt-get install -y sudo curl
  # # On Ubuntu, node versions are always ANCIENT, get modern one!
  chroot "${BOOTDIR}" sh -c "curl -fsSL https://deb.nodesource.com/setup_18.x | bash -"
  # Trouble getting puppeteer running headless chrome, a LOT of unmet dependencies
  chroot "${BOOTDIR}" apt install -y libgtk-3-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 chromium-common chromium
  # Oh boy, really need to go the LONG route here...~root with apache not good and jest/puppeteer just wont work as root
  chroot "${BOOTDIR}" sh -c "echo -e '\n\n\n' | adduser --disabled-password --quiet ede"
  chroot "${BOOTDIR}" sh -c "echo 'ede ALL=(ALL) NOPASSWD: ALL' |tee /etc/sudoers.d/ede"

  mkdir "${BOOTDIR}/home/ede/diagrammer"
  mount --bind "${DIAGRAMMER_SOURCE}" "${BOOTDIR}/home/ede/diagrammer"
  chroot "${BOOTDIR}" "chown -R ede:ede /home/ede/"
  # Also puppeteer/chromium doesnt support running as root with sandbox
  cat >"${BOOTDIR}/home/ede/diagrammer/jest-puppeteer.config.cjs" <<EOF
module.exports = {
  launch: {
    dumpio: false,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
};
EOF
  chroot "${BOOTDIR}" sh -c "su -c 'cd /home/ede/diagrammer;scripts/setup.sh YES_TO_ALL' - ede"
  RC=$?
  if [ $RC -eq 0 ]; then
    chroot "${BOOTDIR}" /etc/init.d/apachd2 stop
    umount "${BOOTDIR}/proc"
    umount "${BOOTDIR}/home/ede/diagrammer"
    rm -fR "${BOOTDIR}"
    echo "Tests completed, all changes removed"
    apache2ctl start
    exit 0
  else
    echo "Something went wrong while testing"
    echo "chroot ${BOOTDIR} su - ede"
    echo "JEST_PUPPETEER_CONFIG=jest-puppeteer.config.cjs npm test"
    exit 10
  fi

  # had to try all sorts of tricks to get headless chrome working on puppeteer
  #JEST_PUPPETEER_CONFIG=jest-puppeteer.config.cjs npm test tests/model/graphedge.test.js
  # find . -type d | xargs -L1 -Ixx chmod 755 xx;find . -type f -perm /u+x | xargs -L1 -Ixx chmod 755 xx;find . -type f -not -perm /u+x | xargs -L1 -Ixx chmod 644 xx
  # also just installing the chrome
  #sudo mount --bind /proc /tmp/stable_ubuntu/proc
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
    sudo apt-get update
    sudo apt-get -y install $*
    ;;
  *)
    error "Unknown architecture ($OSTYPE) - no package install command"
    exit 10
    ;;
  esac
}

install_apache_php() {
  get_www_user() {
    case $OSTYPE in
    darwin*)
      echo "www"
      ;;
    linux*)
      echo "www-data"
      ;;
    *)
      error "Unknown unsupported OS $(uname)"
      exit 10
      ;;
    esac
  }

  make_www_dir() {
    case $OSTYPE in
    darwin*)
      mkdir -p ~/Sites
      ;;
    linux*)
      mkdir -p ~/public_html
      ;;
    esac
  }

  get_apache_and_php_module() {
    case $OSTYPE in
    darwin*)
      warning "# Alas PHP is gone from Macs, there is a way to install, but too complicated for this simple setup"
      ;;
    linux*)
      echo apache2 libapache2-mod-php
      ;;
    esac
  }

  apache_enable_mod() {
    case $OSTYPE in
    darwin*)
      warning "You need to manually enable $*"
      return 0
      ;;
    linux*)
      [ -x /usr/sbin/a2enmod ] && {
        sudo /usr/sbin/a2enmod $*
        return 0
      }
      ;;
    *)
      error "Unknown architecture ($OSTYPE) - no a2enmod command"
      ;;
    esac
  }

  prepare_file() {
    touch $1
    sudo chown :$WWWUSER $1
    sudo chmod 775 $1
  }

  WWWUSER=$(get_www_user)

  install "$(get_apache_and_php_module)"

  apache_enable_mod userdir
  # either succeeds
  PHP_VERSION=$(dpkg-query -W -f '${Version}\n' libapache2-mod-php | sed -r 's/2:([0-9.]+).*/\1/g')
  apache_enable_mod php$PHP_VERSION
  make_www_dir

  # Exported graphs
  for file in $(find web/exported -name "*.json"); do
    prepare_file $file
  done

  sudo apache2ctl restart

  echo "You need to make /home/$USER executable (chmod +x /home/$USER)"
  echo "You may need to ENABLE PHP in userdirs manually(check mods-enabled/php?.?.conf)"

  ln -s ~/diagrammer ~/public_html/diagrammer
  (
    cd web
    ln -s ../icons icons
  )
}

install_diags() {
  case $OSTYPE in
  linux*)
    install python3-nwdiag python3-blockdiag python3-actdiag python3-seqdiag
    ;;
  *)
    error "Unsupported platform $OSTYPE, install nwdiag, blockdiag, actdiag, seqdiags manually"
    ;;
  esac
}

install_plantuml() {
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
  npm i
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
  set -e
  JEST_PUPPETEER_CONFIG=jest-puppeteer.config.cjs make test
}

install_typescript() {
  sudo npm install -g typescript
}

cat <<EOF
NOTICE!

If you plan to use the WWW frontend, you need a web server! Any will do. This setup script can install apache. No need for PHP.

How ever, some renderers require backend rendering even with WWW front (plantuml sequence, mscgen, [act|block|nw|seq]diags), and for that You do need PHP. (Although it would be a minimal job to implement backend rendering in some other style, it is just calling a binary to produce the graph and pipe it as response)

On the other hand, if you only plan to use the command line rendering capabilities, there's no need to webserver. Depending on your graphing needs, you may still require those renderers!

Graphviz can be rendered on WWW/javascript only (excluding sfdp).

Also some renderers are only available via WWW (D3.js, GoJS)

Command line rendering required NodeJS, but WWW relies on many rendering packages via NodeJS. Yes, there are online CDN for these, but for development needs, these are not used.
EOF

confirm install_graphviz "[OPTIONAL!] Install graphviz?"
confirm install_apache_php "[OPTIONAL!] Do you want to install and preconfigure Apache/PHP?"
confirm install_diags "[OPTIONAL!] Do you want to install nwdiag, blockdiag, actdiag, seqdiag?"
confirm install_mscgen "[OPTIONAL!] Do you want to install mscgen?"
confirm install_plantuml "[OPTIONAL!] Do you want to install plantuml?"
confirm install_nodejs "[Required!] Do you want to install nodejs and npm?"
confirm install_typescript "[Required!] tsc(Typescript) is required to transpile, install (will use npm -g)?"
echo "If you installed renderers, nodejs and its modules, you can now run the test suite to verify all works as expected"
confirm run_tests "[Optional!] Run tests?"

#Also requires is typescript?
