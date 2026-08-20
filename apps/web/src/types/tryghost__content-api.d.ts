declare module '@tryghost/content-api' {
  interface GhostAPIOptions {
    url: string;
    key: string;
    version: string;
  }
  interface BrowseParams {
    limit?: number | 'all';
    filter?: string;
    include?: string | string[];
    order?: string;
    page?: number;
    fields?: string | string[];
  }
  interface ReadParams {
    slug?: string;
    id?: string;
    include?: string | string[];
  }
  export default class GhostContentAPI {
    constructor(options: GhostAPIOptions);
    posts: {
      browse(params?: BrowseParams): Promise<any[]>;
      read(data: ReadParams, params?: BrowseParams): Promise<any>;
    };
  }
}
