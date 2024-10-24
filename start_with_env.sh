#!/usr/bin/env sh

sed -i -E 's@(window.__dynamic_base__=)[^<]+@\1\"'"$BASE_PATH"'\"@g' /usr/share/nginx/html/index.html

find '/usr/share/nginx/html' -name '*.js' -exec sed -i -e 's,UNIBEE_API_URL,'"$UNIBEE_API_URL"',g' {} \;
find '/usr/share/nginx/html' -name '*.js' -exec sed -i -e 's,UNIBEE_ANALYTICS_API_URL,'"$UNIBEE_ANALYTICS_API_URL"',g' {} \;
nginx -g "daemon off;"
