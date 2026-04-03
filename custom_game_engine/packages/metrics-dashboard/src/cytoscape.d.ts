// Minimal ambient declarations for cytoscape — @types/cytoscape not in dependencies
declare module 'cytoscape' {
  export interface NodeSingular {
    data(key: string): unknown;
    [key: string]: any;
  }

  export interface Core {
    on(event: string, selector: string, handler: (event: any) => void): void;
    destroy(): void;
    [key: string]: any;
  }

  interface CytoscapeStatic {
    (options?: Record<string, any>): Core;
    use(plugin: any): void;
  }

  const cytoscape: CytoscapeStatic;
  export default cytoscape;
}
