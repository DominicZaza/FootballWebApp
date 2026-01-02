tar --exclude node_modules --exclude .git --exclude .idea --exclude dist --exclude tarCommand.bat -cvf abc.tar .
copy abc.tar \\znas\zRuntime\dzaza
