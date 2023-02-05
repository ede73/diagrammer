#!/bin/bash
# USE AT OWN RISK! Haven't run in a while...
[[ -d web ]] && [[ -d ace ]] && [[ -d css ]] && [[ -d generators ]] && [[ -d model ]] || {
  echo "Run this is diagrammer folder..."
  exit 10
}

error() {
  echo >&2 "ERROR: $*"
}

get_www_user() {
  case $OSTYPE in
  darwin*)
    echo "www"
    ;;
  linux*)
    echo "www-data"
    ;;
  *)
    error "Unknown $OSTYPE"
    exit 10
    ;;
  esac
}

WWWUSER=$(get_www_user)

prepare_file() {
  touch $1
  sudo chown :$WWWUSER $1
  sudo chmod 775 $1
}

for file in web web/post.txt web/result.png web/result.txt web/error.txt; do
  prepare_file $file
done

for file in $(ls web/*.json); do
  prepare_file $file
done

debian_package_search() {
  apt-cache show $* >/dev/null
  return $?
}

install() {
  case $OSTYPE in
  darwin*)
    # my mach resets these, brew doctor helps..
    sudo chown -R $(whoami) /usr/local/bin /usr/local/lib /usr/local/sbin
    chmod u+w /usr/local/bin /usr/local/lib /usr/local/sbin
    brew install $*
    ;;
  linux*)
    sudo apt-get update
    sudo apt-get -y install $*
    return 0
    ;;
  *)
    error "Unknown architecture - no package install command"
    exit 10
    ;;
  esac
}

apache_enable_mod() {
  case $OSTYPE in
  darwin*)
    error "You need to manually enable $*"
    return 0
    ;;
  linux*)
    [[ -x /usr/sbin/a2enmod ]] && {
      sudo /usr/sbin/a2enmod $*
      return 0
    }
    ;;
  esac
  error "Unknown architecture  $OSTYPE - no a2enmod command"
}

apache_restart() {
  which systemctl && {
    sudo systemctl restart apache2
    return 0
  }
  error "Unknown architecture $OSTYPE - no systemctl command"
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

get_php_apache_module() {
  case $OSTYPE in
  linux*)
    debian_package_search libapache2-mod-php7.4 && {
      echo libapache2-mod-php7.4
      return 0
    }
    debian_package_search libapache2-mod-php7.3 && {
      echo libapache2-mod-php7.3
      return 0
    }
    return 0
    ;;
  *) ;;

  esac
}

get_apache() {
  case $OSTYPE in
  linux*)
    echo "apache2"
    ;;
  esac
}

get_jison() {
  case $OSTYPE in
  linux*)
    echo "jison"
    ;;
  esac
  error "jison pkg may be needed"
}

get_block_crap() {
  case $OSTYPE in
  linux*)
    echo "python3-nwdiag python3-blockdiag python3-actdiag"
    ;;
  esac
  error "nwdiag blockdiag actdiag pkgs may be needed"
}

# Note MAC brew install graphviz --with-pango
PHP_MODULE=$(get_php_apache_module)
APACHE=$(get_apache)
JISON=$(get_jison)
BLOCKCRAP=$(get_block_crap)

# uh oh, rasp zero is armv6 and openjdk-11 doesn't provide armv6 compaible build (openjdk11 is default)
uname -m | grep armv6 && {
  install openjdk-8-jdk
  # this may not be enuf, might need to set as default, as jdk11 installs anyway(as it seems)
  # but it solved the Vm (armv6 not supported) issue on ca-certificates-java
}

install "$JISON" "$APACHE" "$PHP_MODULE" graphviz mscgen plantuml "$BLOCKCRAP" node

apache_enable_mod userdir
# either succeeds
apache_enable_mod php7.3
apache_enable_mod php7.4
make_www_dir

cd web
tar fxj ../ext/canviz-0.1.tar.bz2

apache_restart
echo "You need to ENABLE PHP in userdirs manually"

(
  cd web
  ln -s ../icons icons
)
