import {useAPI} from "../ducks/app";

type NodeClientOptions = {
  apiHost: string;
  apiKey?: string;
};

export default class NodeClient {
  apiHost: string;
  apiKey?: string;

  constructor(options: NodeClientOptions) {
    this.apiHost = options.apiHost;
    this.apiKey = options.apiKey;
  }

  getHeaders(): any {
    const {hostname} = new URL(this.apiHost);
    const isLocalhost = ['127.0.0.1', 'localhost'].includes(hostname);
    const headers: any = {
      'Authorization': this.apiKey && 'Basic ' + Buffer.from(`x:${this.apiKey}`).toString('base64'),
    };

    if (!isLocalhost) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  getTokenURL(): string {
    const [protocol, url] = this.apiHost.split('//');

    return `${protocol}//x:${this.apiKey}@${url}`;
  }

  async getBlockchainInfo () {
    const headers = this.getHeaders();

    const resp = await fetch(this.apiHost, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        method: 'getblockchaininfo',
        params: [],
      }),
    });

    return await resp.json();
  }

  async getBlock(blockHash: string) {
    const headers = this.getHeaders();

    const resp = await fetch(this.apiHost, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        method: 'getblock',
        params: [blockHash],
      }),
    });

    return await resp.json();
  }

  async getNameInfo(tld: string) {
    const headers = this.getHeaders();
    const resp = await fetch(this.apiHost, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        method: 'getnameinfo',
        params: [tld],
      }),
    });
    return await resp.json();
  }

  async getCoin(txHash: string, txIndex: number) {
    const headers = this.getHeaders();
    const resp = await fetch(`${this.apiHost}/coin/${txHash}/${txIndex}`, {
      method: 'GET',
      headers: headers,
    });

    return await resp.json();
  }

  async getTXByHash(txHash: string) {
    const headers = this.getHeaders();
    const resp = await fetch(`${this.apiHost}/tx/${txHash}`, {
      method: 'GET',
      headers: headers,
    });

    return await resp.json();
  }
}

export const useNodeClient = () => {
  const {apiHost, apiKey} = useAPI();
  return new NodeClient({ apiHost, apiKey });
};
