const WEBSOCKET_URL_ENDPOINT = '/websocket_url';
const RETRY_INTERVAL_MSECS = 5000;

const WEBSOCKET_URL_DEBUG = 'ws://localhost:8081';
declare let DEBUG_MODE: undefined | boolean;

async function sleep (milliseconds:number) {
  return new Promise((resolve:(value: unknown) => void) => setTimeout(resolve, milliseconds));
}

export async function getWebsocketURL () :Promise<string> {
  if (typeof (DEBUG_MODE) !== 'undefined') {
    console.log('debug mode: websocker url is ' + WEBSOCKET_URL_DEBUG);
    return new Promise((resolve:(value: string) => void) => resolve(WEBSOCKET_URL_DEBUG));
  }

  return await fetch(WEBSOCKET_URL_ENDPOINT).then(async (res:Response) => {
    if (res.ok) {
      return res.text();
    } else {
      console.log(WEBSOCKET_URL_ENDPOINT + ': ' + res.status + res.statusText);
      console.log('retry...');
      await sleep(RETRY_INTERVAL_MSECS);
      return getWebsocketURL();
    }
  }).then((url:string) => {
    return url;
  }).catch(async (reason:any) => {
    console.log(reason);
    console.log('retry...');
    await sleep(RETRY_INTERVAL_MSECS);
    return getWebsocketURL();
  });
}
