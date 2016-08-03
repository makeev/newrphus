# Newrphus
Let users send misprints from your website to Slack using lua script via nginx.
[lua-resty-http](https://github.com/pintsized/lua-resty-http) and [lua cjson](http://www.kyne.com.au/~mark/software/lua-cjson-manual.html) is required.

Library contains nginx lua file and Javascript front-end file. You should use both of them to make misprint reporter works.

When user selects text on a page and presses <kbd>Ctrl+Enter</kbd>, the Newrphus sends POST request to `url` with selected text and contextbefore and after selected text . Right after the keypress event, it calls `callback` function, where you can tell user that report was sent.

## How to use
1. [Create new Incoming webhook](https://slack.com/services/new/incoming-webhook) in Slack.
2. Configure your nginx file
    ```nginx
    http {
        lua_shared_dict misprint_fixed 5m; # sahred dict to not send misprints twice
        lua_package_path "/path/to/lua-resty-http/lib/?.lua;;";
        limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s; # flood protection

        server {
            location / {
                # your default backend (php, python, ruby)
                include /usr/local/etc/nginx/proxy_params;
                proxy_pass  http://127.0.0.1:8000/;
            }

            location /lua_script/ {
                resolver 8.8.8.8;  # dns resolver for resty.http
                limit_req zone=one burst=2; # antiflood

                content_by_lua_file /path/to/src/script.lua;
        }
    }

    ```
3. Modify `slack_config` dict in `src/script.lua` file.
4. Include js to the page, where you want to track misprints.
    ```html
    <script src="js/newrphus.js"></script>
    <script>
      newrphus.init({
        url: '/lua_script/',
        callback: function() {
          alert('Misprint sent');
        }
      });
    </script>
    ```

5. Tell users to select text and press <kbd>Ctrl+Enter</kbd> to send report.
