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

install jison

