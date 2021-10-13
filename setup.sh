debian_install() {
  sudo apt-get update
  sudo apt-get -y install $*
}

debian_package_search() {
  apt-cache show $*
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
  which a2enmod && {
    sudo a2enmod $*
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
  }
  debian_package_search libapache2-mod-php7.3 && {
    echo libapache2-mod-php7.3
  }
}

# Note MAC brew install graphviz --with-pango
PHP_MODULE=$(get_php_apache_module)

install jison apache2 "$PHP_MODULE" graphviz mscgen plantuml
apache_enable_mod userdir
apache_enable_mod php7
make_home_dir
apache_restart

