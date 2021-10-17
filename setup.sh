prepare_file() {
  touch $1
  sudo chown :$WWWUSER $1
  sudo chmod 775 $1
}

WWWUSER=www-data
for file in web web/post.txt web/result.png web/result.txt web/error.txt; do
  prepare_file $file
done

for file in $(ls web/*.json); do
  prepare_file web/$file
done


debian_install() {
  sudo apt-get update
  sudo apt-get -y install $*
}

debian_package_search() {
  apt-cache show $* >/dev/null
  return $?
}

install() {
  which apt-get && {
    debian_install $*
    return 0
  }
  echo "Unknown architecture - no package install command"
  exit 10
}

apache_enable_mod() {
  [[ -x /usr/sbin/a2enmod ]] && {
    sudo /usr/sbin/a2enmod $*
    return 0
  }
  echo "Unknown architecture - no a2enmod command"
  exit 10
}

apache_restart() {
  which systemctl && {
    sudo systemctl restart apache2
    return 0
  }
  echo "Unknown architecture - no systemctl command"
  exit 10
}

make_home_dir() {
  # in linux
  mkdir -p ~/public_html
}


get_php_apache_module() {
  debian_package_search libapache2-mod-php7.4 && {
    echo libapache2-mod-php7.4
    return 0
  }
  debian_package_search libapache2-mod-php7.3 && {
    echo libapache2-mod-php7.3
    return 0
  }
  echo "No install candidates for apache2-php modules"
  exit 10
}

# Note MAC brew install graphviz --with-pango
PHP_MODULE=$(get_php_apache_module)

# uh oh, rasp zero is armv6 and openjdk-11 doesn't provide armv6 compaible build (openjdk11 is default)
uname -m | grep armv6 && {
  install openjdk-8-jdk
  # this may not be enuf, might need to set as default, as jdk11 installs anyway(as it seems)
  # but it solved the Vm (armv6 not supported) issue on ca-certificates-java
}
install jison apache2 "$PHP_MODULE" graphviz mscgen plantuml python3-nwdiag python3-blockdiag python3-actdiag
apache_enable_mod userdir
# either succeeds
apache_enable_mod php7.3
apache_enable_mod php7.4
make_home_dir

cd web
tar fxj ../ext/canviz-0.1.tar.bz2

apache_restart
echo "You need to ENABLE PHP in userdirs manually"
