window.penTools = {
    fuzz: { 
     fetch: (url, options) => {
       let config = { fuzzBody: false, fuzzUrl: false }
       let fuzzFunc = {};
       pause = async (ms) => {
         await new Promise((resolve) => {
           setTimeout(resolve, ms);
         })
       }
       let contentTypeHeaderKey = Object.keys(options.headers || []).filter(headerName => headerName.toUpperCase() === 'CONTENT-TYPE')[0];
       if(contentTypeHeaderKey) {
         config.contentType = options.headers[contentTypeHeaderKey];
       } else {
         //infer the type
         console.log('content type unspecified, inferring type.')
         if(!options.method || options.method === 'GET') {
             config.contentType = null;
         } else {
            config.contentType = 'application/x-www-form-urlencoded'; 
         }
       }
       switch(config.contentType) {
         case null:
             config.configBody = () => { return '' }
             break;
         case 'application/x-www-form-urlencoded':
           if(options.body) {
             config.bodyParams = options.body.split('&').reduce((bodyParams, kv) => {
               [key, val] = kv.split('=');
               bodyParams[key] = val;
               return bodyParams;
             }, {});
             config.constructBody = (params) => {
               return Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
             }
           }
           break;
         case 'application/json':
           if(options.body) {
             config.bodyParams = JSON.parse(options.body);
           }
           console.log("fuzzing as JSON");
           config.constructBody = JSON.stringify;
           break;
         default:
           console.log('Type issue ', config.contentType)
       }
       fuzzFunc.run = (fuzzingOptions) => {
         console.log('Initiating Run config: ', config);
         let throttle = fuzzingOptions?.throttle || 0;
         (`Throttling ${throttle}ms between requests.`);
         if(config.fuzzBody) {
           console.log('fuzzing the Body');
           config.targetBodyParams.forEach(async (paramName, oind) => {
             await pause(oind * config.words.length * throttle);
             await config.words.forEach(async (payload, ind) => {
               let fuzzParam = {}; fuzzParam[paramName] = payload;
               let fuzzBody = config.constructBody(Object.assign({}, config.bodyParams, fuzzParam));
               let fuzzOpts = Object.assign({}, options, { body: fuzzBody });
               await pause(throttle * ind);
               let resp = await fetch(url, fuzzOpts);
               console.log('resp - ' + JSON.stringify(fuzzOpts), resp);
             })
           })
         }
         if(config.fuzzUrl) {
            console.log('fuzzing the URL parameters')
            config.urlParams.forEach(async (paramName, oind) => {
                await pause(oind * config.words.length * throttle);
                await config.words.forEach(async (payload, ind) => {
                    let fuzzParam = {}; fuzzParam[paramName] = payload;
                    let targetUrl = config.renderUrl(fuzzParam);
                    await pause(throttle * ind);
                    let resp = await fetch(targetUrl, options);
                    console.log('res - URL: ' + targetUrl + ' ', resp);
                })
            })
         }
         return 'Done.';
       }
       fuzzFunc.forceType = (type) => {
         config.type = type;
         return fuzzFunc;
       }
       fuzzFunc.fuzzUrl = (urlTemplate, params) => {
         config.fuzzUrl = true;
         config.renderUrl = ((template, defaults) => {
            return (overrides) => { let param = Object.assign({}, defaults, overrides); return new Function("param = " + JSON.stringify(param) + ";return `" + template + "`").call()};
          })(urlTemplate, params)
         config.urlParams = Object.keys(params);
         return fuzzFunc;
       }
       fuzzFunc.fuzzBodyParams = (paramList) => {
         config.fuzzBody = true;
         config.targetBodyParams = (paramList === undefined ? Object.keys(config.bodyParams) :  paramList);
         return fuzzFunc;
       }
       fuzzFunc.setWordList = (words) => {
         console.log('woords', words);
         if(!Array.isArray(words))
           words = words.split('\n');
         config.words = words;
         return fuzzFunc;
       }
       fuzzFunc.loadWordList= () => {
         let inputEl = document.createElement("input");
         inputEl.setAttribute("type", "file");
         let reader = new FileReader();
         reader.addEventListener('load', (evt) => fuzzFunc.setWordList(evt.target.result));
         inputEl.addEventListener('change', () => { reader.readAsText(inputEl.files[0]) })
         inputEl.click()
         return fuzzFunc;
       }
       fuzzFunc.dryRun = (fuzzingOptions) => {
         console.log('Initiating Dry Run config: ', config);
         let throttle = fuzzingOptions?.throttle || 0;
         (`Throttling ${throttle}ms between requests.`);
         if(config.fuzzBody) {
           console.log('fuzzing the Body');
           config.targetBodyParams.forEach(async (paramName, oind) => {
             await pause(oind * config.words.length * throttle);
             await config.words.forEach(async (payload, ind) => {
               let fuzzParam = {}; fuzzParam[paramName] = payload;
               let fuzzBody = config.constructBody(Object.assign({}, config.bodyParams, fuzzParam));
               let fuzzOpts = Object.assign({}, options, { body: fuzzBody });
               await pause(throttle * ind);
               console.log(`dry - fetch('${url}', ${JSON.stringify(fuzzOpts)})`);
             })
           })
         }
         return 'Done.';
       }
       return fuzzFunc;
     }
 }
 }
