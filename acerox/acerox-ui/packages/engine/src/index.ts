export interface EngineConfig {
  document: any; // later: IRDocument
}

export interface Command {
  op: string;
  args?: any;
}

export class Engine {
  private state: any;

  constructor(cfg: EngineConfig) {
    this.state = cfg.document;
  }

  apply(cmd: Command) {
    // TODO: dispatch logic
    console.log("Apply command", cmd);
  }

  getState() {
    return this.state;
  }
}
