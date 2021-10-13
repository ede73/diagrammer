debian_install() {
  sudo apt-get update
  sudo apt-get install $*
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
  mkdir ~/public_html
}

install jison apache2 libapache2-mod-php7.3
apache_enable_mod userdir
apache_enable_mod php7
make_home_dir
apache_restart

