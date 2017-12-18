#!/bin/sh

db=$(dirname "$0")
echo $db

#db=$(dirname $db)
db=$(cd $db/.. && pwd)/chains/ganache
echo $db

