import React, { useEffect } from 'react';

const MailerLiteEmbed: React.FC = () => {
  useEffect(() => {
    (window as any).ml_webform_success_38091339 = () => {
      const w = window as any;
      const $ = w.ml_jQuery || w.jQuery;
      if ($) {
        $('.ml-subscribe-form-38091339 .row-success').show();
        $('.ml-subscribe-form-38091339 .row-form').hide();
      } else {
        const success = document.querySelector('.ml-subscribe-form-38091339 .row-success') as HTMLElement | null;
        const form = document.querySelector('.ml-subscribe-form-38091339 .row-form') as HTMLElement | null;
        if (success) success.style.display = 'block';
        if (form) form.style.display = 'none';
      }
    };

    const scriptId = 'ml-webforms-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://groot.mailerlite.com/js/w/webforms.min.js?v95037e5bac78f29ed026832ca21a7c7b';
      script.async = true;
      document.body.appendChild(script);
    }

    const takelId = 'ml-webforms-takel';
    if (!document.getElementById(takelId)) {
      const takelScript = document.createElement('script');
      takelScript.id = takelId;
      takelScript.text = 'fetch("https://assets.mailerlite.com/jsonp/1861664/forms/181200568191026271/takel")';
      document.body.appendChild(takelScript);
    }
  }, []);

  const embedHtml = `
<style type="text/css">@import url("https://assets.mlcdn.com/fonts.css?version=1772711");</style>
<style type="text/css">

/* LOADER */
.ml-form-embedSubmitLoad { display: inline-block; width: 20px; height: 20px; }
.g-recaptcha { transform: scale(1); -webkit-transform: scale(1); transform-origin: 0 0; -webkit-transform-origin: 0 0; height: ; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
.ml-form-embedSubmitLoad:after { content: " "; display: block; width: 11px; height: 11px; margin: 1px; border-radius: 50%; border: 4px solid #fff; border-color: #ffffff #ffffff #ffffff transparent; animation: ml-form-embedSubmitLoad 1.2s linear infinite; }
@keyframes ml-form-embedSubmitLoad { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
#mlb2-38091339.ml-form-embedContainer { box-sizing: border-box; display: table; margin: 0 auto; position: static; width: 100% !important; }
#mlb2-38091339.ml-form-embedContainer,
#mlb2-38091339.ml-form-embedContainer .ml-form-align-center,
#mlb2-38091339.ml-form-embedContainer .ml-form-align-default,
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper,
#mlb2-38091339.ml-form-embedContainer .row-form,
#mlb2-38091339.ml-form-embedContainer .ml-form-embedBody,
#mlb2-38091339.ml-form-embedContainer form,
#mlb2-38091339.ml-form-embedContainer .ml-form-formContent,
#mlb2-38091339.ml-form-embedContainer .ml-field-group { background: transparent !important; }
#mlb2-38091339.ml-form-embedContainer h4,
#mlb2-38091339.ml-form-embedContainer p,
#mlb2-38091339.ml-form-embedContainer span,
#mlb2-38091339.ml-form-embedContainer button { text-transform: none !important; letter-spacing: normal !important; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper { background-color: transparent; border-width: 0px; border-color: transparent; border-radius: 12px; border-style: solid; box-sizing: border-box; display: inline-block !important; margin: 0; padding: 0; position: relative; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper.embedPopup,
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper.embedDefault { width: 400px; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper.embedForm { max-width: 420px; width: 100%; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody { padding: 0; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-embedContent,
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-successBody .ml-form-successContent { margin: 0 0 12px 0; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-fieldRow { margin: 0 0 10px 0; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody form { padding: 0; }
#mlb2-38091339.ml-form-embedContainer .ml-form-align-left { text-align: left; }
#mlb2-38091339.ml-form-embedContainer .ml-form-align-center { text-align: center; }
#mlb2-38091339.ml-form-embedContainer .ml-form-align-default { display: table-cell !important; vertical-align: middle !important; text-align: center !important; }
#mlb2-38091339.ml-form-embedContainer .ml-form-align-right { text-align: right; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedHeader img { border-top-left-radius: 4px; border-top-right-radius: 4px; height: auto; margin: 0 auto !important; max-width: 100%; width: undefinedpx; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody,
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-successBody { padding: 0; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-successBody { background: var(--surface-2); border: 1px solid var(--border); border-radius: 16px; padding: 18px 18px 14px 18px; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-successBody .ml-form-successContent { margin: 0; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody.ml-form-embedBodyHorizontal { padding-bottom: 0; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-embedContent,
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-successBody .ml-form-successContent { text-align: left; margin: 0 0 12px 0; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-embedContent h4,
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-successBody .ml-form-successContent h4 { color: var(--text); font-family: 'Open Sans', Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 600; margin: 0 0 10px 0; text-align: left; word-break: break-word; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-embedContent p,
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-successBody .ml-form-successContent p { color: var(--muted-2); font-family: 'Open Sans', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 20px; margin: 0 0 10px 0; text-align: left; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-embedContent p a,
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-successBody .ml-form-successContent p a { color: #fbbf24; text-decoration: underline; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-block-form .ml-field-group { text-align: left!important; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-block-form .ml-field-group label { display: none !important; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody form { margin: 0; width: 100%; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-formContent,
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-checkboxRow { margin: 0 0 14px 0; width: 100%; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-checkboxRow { float: left; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-fieldRow { margin: 0 0 10px 0; width: 100%; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-fieldRow.ml-last-item { margin: 0; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-fieldRow input { background-color: rgba(15,23,42,0.92) !important; color: #f8fafc !important; border-color: rgba(255,255,255,0.1); border-radius: 18px !important; border-style: solid !important; border-width: 1px !important; font-family: 'Open Sans', Arial, Helvetica, sans-serif; font-size: 13px !important; height: auto; line-height: 20px !important; margin: 0 !important; padding: 12px 14px !important; width: 100% !important; box-sizing: border-box !important; max-width: 100% !important; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-fieldRow input:focus { outline: none; border-color: rgba(251,191,36,0.6); box-shadow: 0 0 0 3px rgba(251,191,36,0.15); }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-fieldRow input::placeholder { color: #64748b; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-embedSubmit { margin: 0; float: left; width: 100%; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-embedSubmit button { background-color: #fbbf24 !important; border: none !important; border-radius: 9999px !important; box-shadow: 0 10px 24px rgba(251,191,36,0.25) !important; color: #0f172a !important; cursor: pointer; font-family: 'Open Sans', Arial, Helvetica, sans-serif !important; font-size: 11px !important; font-weight: 800 !important; letter-spacing: 0.12em; text-transform: uppercase; line-height: 18px !important; height: auto; padding: 11px 14px !important; width: 100% !important; box-sizing: border-box !important; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-embedBody .ml-form-embedSubmit button:hover { background-color: #f59e0b !important; transform: translateY(-1px); }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedPermissionsContent p { color: var(--text); font-size: 11px; line-height: 16px; margin: 0 0 10px 0; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedPermissionsContent p a { color: var(--accent); }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-successBody { background: rgba(15,23,42,0.85); border: 1px solid rgba(255,255,255,0.12); }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-successBody .ml-form-successContent h4 { color: #f8fafc; font-size: 22px; margin-bottom: 6px; }
#mlb2-38091339.ml-form-embedContainer .ml-form-embedWrapper .ml-form-successBody .ml-form-successContent p { color: #cbd5f5; }
@media only screen and (max-width: 400px){ .ml-form-embedWrapper.embedDefault, .ml-form-embedWrapper.embedPopup { width: 100%!important; } }
</style>

<div id="mlb2-38091339" class="ml-form-embedContainer ml-subscribe-form ml-subscribe-form-38091339">
  <div class="ml-form-align-center ">
    <div class="ml-form-embedWrapper embedForm">
      <div class="ml-form-embedBody ml-form-embedBodyDefault row-form">
        <form class="ml-block-form" action="https://assets.mailerlite.com/jsonp/1861664/forms/181200568191026271/subscribe" data-code="" method="post" target="_blank">
          <div class="ml-form-formContent">
            <div class="ml-form-fieldRow ">
              <div class="ml-field-group ml-field-name">
                <label>Name</label>
                <input aria-label="name" type="text" class="form-control" data-inputmask="" name="fields[name]" placeholder="Your name" autocomplete="given-name">
              </div>
            </div>
            <div class="ml-form-fieldRow ml-last-item">
              <div class="ml-field-group ml-field-email ml-validate-email ml-validate-required">
                <label>Email</label>
                <input aria-label="email" aria-required="true" type="email" class="form-control" data-inputmask="" name="fields[email]" placeholder="Email address" autocomplete="email">
              </div>
            </div>
          </div>

          <div class="ml-form-embedPermissions" style="">
            <div class="ml-form-embedPermissionsContent default privacy-policy">
              <p>You can unsubscribe anytime. For more details, review our <a href="/policy">Privacy Policy</a>.</p>
            </div>
          </div>

          <input type="hidden" name="ml-submit" value="1">

          <div class="ml-form-embedSubmit">
            <button type="submit" class="primary">Get Updates</button>
            <button disabled="disabled" style="display: none;" type="button" class="loading">
              <div class="ml-form-embedSubmitLoad"></div>
              <span class="sr-only">Loading...</span>
            </button>
          </div>

          <input type="hidden" name="anticsrf" value="true">
        </form>
      </div>

      <div class="ml-form-successBody row-success" style="display: none">
        <div class="ml-form-successContent">
          <h4>Thanks for joining!</h4>
          <p>Watch your inbox for the next faith + tech update.</p>
        </div>
      </div>
    </div>
  </div>
</div>
`;

  return <div dangerouslySetInnerHTML={{ __html: embedHtml }} />;
};

export default MailerLiteEmbed;
