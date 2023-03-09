#!/bin/sh
# Minimize the amount of builds due to the fact that
# "saved" file is DEFINITELY modified multiple times in short occasion
# but also ensure that we dont miss anything
# And also prevent parallel builds
MAKE_LOCK=$(grep ^LOCK_FILE Makefile | cut -d= -f2)
MAKE_BUILD_STAMP=$(grep ^BUILD_STARTED_FILE Makefile | cut -d= -f2)
WATCHED_FILES_CHANGED=.request_build
MAX_LOCK_AGE=1
DEBUG=0

debug() {
    [ $DEBUG -ne 0 ] && {
        echo "$*"
    }
}

isBuildRunning() {
    # Just to silence find
    [ -f "$MAKE_LOCK" ] || {
        debug "    No lock file, say build is NOT running"
        return 1
    }
    if find "$MAKE_LOCK" -nowarn -mmin -${MAX_LOCK_AGE} -exec false {} + >/dev/null; then
        # Our builds under any circumstances complete in less than a minute
        debug "    Lock file is older than $MAX_LOCK_AGE minutes old, let's say build isn't running"
        return 1
    fi
    [ -f "$MAKE_LOCK" ] && {
        debug "    Have lock file, say build is running"
        return 0
    }
    debug "    Fall thru, should nt happen"
}

isBuildNeeded() {
    [ -f "$MAKE_BUILD_STAMP" ] || {
        debug "    Have no build time stamp, so say yes, build is needed"
        return 0
    }
    # MAKE_BUILD_STAMP must exist (and in this script will) b4 executing this
    [ -n "$(find $WATCHED_FILES_CHANGED -newer $MAKE_BUILD_STAMP)" ] && {
        debug "    Change request is newer than build START time stamp, say build needed"
        return 0
    }
    debug "    no new build is needed $(ls -l $WATCHED_FILES_CHANGED $MAKE_BUILD_STAMP)"
    return 1
}

#if isBuildRunning; then echo build running; fi
#if ! isBuildRunning; then echo build not running; fi
#if isBuildNeeded; then echo build needed; fi
#if ! isBuildNeeded; then echo build not needed; fi

inotifywait -m -e modify --format '%w%f' --include ".*.ts$" model generators web tests |
    while read path; do
        touch "$WATCHED_FILES_CHANGED"
        #maybeBuild
        make
    done &
debug "Exiting watcher"
