local cjson = require "cjson"
local http = require "resty.http"

ngx.header.content_type = 'text/html;charset=utf-8'
if ngx.req.get_method() ~= "POST" then
    ngx.exit(405)
end

local slack_config = {
    endpoint = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
    username = 'Botname',
    link_names = '1',
    color = '#cccccc',
    icon_emoji = ':pencil2:'
}

local function send_to_slack(misprint_text, misprint_context, url)
    if misprint_text == '' then
        return
    end

    misprint_text = string.sub(misprint_text, 0, 1000)
    misprint_hash = ngx.md5(misprint_text .. url)
    slack_message = 'New misprint <' .. url .. '|here>'
    slack_fallback = misprint_text

    slack_payload = {
        username = slack_config['username'],
        icon_emoji = slack_config['icon_emoji'],
        attachments = {
            {
                fallback = slack_message,
                pretext = slack_message,
                color = slack_config['color'],
                fields = {
                    {
                        title = misprint_text,
                        value = misprint_context or misprint_text,
                        short = false
                    }
                }
            }
        }
    }
    json_payload = cjson.encode(slack_payload)

    if ngx.shared.misprint_fixed:get(misprint_hash) then
        ngx.status = 202
        ngx.say("misprint already sent")
        return false
    end

    local http_client = http.new()
    local res, err = http_client:request_uri(slack_config['endpoint'], {
        method = "POST",
        body = json_payload,
        ssl_verify = false
    })

    if not res then
        ngx.status = 500
        ngx.say("failed to request: ", err)
        return false
    end

    ngx.shared.misprint_fixed:add(misprint_hash, true)

    ngx.status = 200
    ngx.say("got it")
    return true
end

ngx.req.read_body()
local args, err = ngx.req.get_post_args()
if not args then
    ngx.status = 500
    ngx.say("failed to get post args: ", err)
    return
end

local text = args['text']
local context = args['context']
local url = args['url']
send_to_slack(text, context, url)
