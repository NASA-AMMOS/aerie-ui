/* eslint-disable */
/** START Preface */

export enum TimingTypes {
  ABSOLUTE = 'ABSOLUTE',
  COMMAND_RELATIVE = 'COMMAND_RELATIVE',
  EPOCH_RELATIVE = 'EPOCH_RELATIVE',
  COMMAND_COMPLETE = 'COMMAND_COMPLETE',
}

// @ts-ignore : 'Args' found in JSON Spec
export type CommandOptions<A extends Args[] | { [argName: string]: any } = [] | {}> = {
  stem: string;
  arguments: A;
  // @ts-ignore : 'Metadata' found in JSON Spec
  metadata?: Metadata | undefined;
  // @ts-ignore : 'Description' found in JSON Spec
  description?: Description | undefined;
  // @ts-ignore : 'Model' found in JSON Spec
  models?: Model[] | undefined;
} & (
  | {
      absoluteTime: Temporal.Instant;
    }
  | {
      epochTime: Temporal.Duration;
    }
  | {
      relativeTime: Temporal.Duration;
    }
  // CommandComplete
  | {}
);

// @ts-ignore : 'Args' found in JSON Spec
export type ImmediateOptions<A extends Args[] | { [argName: string]: any } = [] | {}> = {
  stem: string;
  arguments: A;
  // @ts-ignore : 'Metadata' found in JSON Spec
  metadata?: Metadata | undefined;
  // @ts-ignore : 'Description' found in JSON Spec
  description?: Description | undefined;
};

export type HardwareOptions = {
  stem: string;
  // @ts-ignore : 'Description' found in JSON Spec
  description?: Description;
  // @ts-ignore : 'Metadata' found in JSON Spec
  metadata?: Metadata;
};

export type GroundOptions = {
  name: string;
  // @ts-ignore : 'Args' found in JSON Spec
  args?: Args;
  // @ts-ignore : 'Description' found in JSON Spec
  description?: Description;
  // @ts-ignore : 'Metadata' found in JSON Spec
  metadata?: Metadata;
  // @ts-ignore : 'Model' found in JSON Spec
  models?: Model[];
} & (
  | {
      absoluteTime: Temporal.Instant;
    }
  | {
      epochTime: Temporal.Duration;
    }
  | {
      relativeTime: Temporal.Duration;
    }
  // CommandComplete
  | {}
);

export type Arrayable<T> = T | Arrayable<T>[];

export interface SequenceOptions {
  seqId: string;
  // @ts-ignore : 'Metadata' found in JSON Spec
  metadata: Metadata;

  // @ts-ignore : 'VariableDeclaration' found in JSON Spec
  locals?: [VariableDeclaration, ...VariableDeclaration[]];
  // @ts-ignore : 'VariableDeclaration' found in JSON Spec
  parameters?: [VariableDeclaration, ...VariableDeclaration[]];
  // @ts-ignore : 'Step' found in JSON Spec
  steps?: Step[];
  // @ts-ignore : 'Request' found in JSON Spec
  requests?: Request[];
  // @ts-ignore : 'ImmediateCommand' found in JSON Spec
  immediate_commands?: ImmediateCommand[];
  // @ts-ignore : 'HardwareCommand' found in JSON Spec
  hardware_commands?: HardwareCommand[];
}

declare global {
  // @ts-ignore : 'SeqJson' found in JSON Spec
  class Sequence implements SeqJson {
    public readonly id: string;
    // @ts-ignore : 'Metadata' found in JSON Spec
    public readonly metadata: Metadata;

    // @ts-ignore : 'VariableDeclaration' found in JSON Spec
    public readonly locals?: [VariableDeclaration, ...VariableDeclaration[]];
    // @ts-ignore : 'VariableDeclaration' found in JSON Spec
    public readonly parameters?: [VariableDeclaration, ...VariableDeclaration[]];
    // @ts-ignore : 'Step' found in JSON Spec
    public readonly steps?: Step[];
    // @ts-ignore : 'Request' found in JSON Spec
    public readonly requests?: Request[];
    // @ts-ignore : 'ImmediateCommand' found in JSON Spec
    public readonly immediate_commands?: ImmediateCommand[];
    // @ts-ignore : 'HardwareCommand' found in JSON Spec
    public readonly hardware_commands?: HardwareCommand[];
    [k: string]: unknown;

    public static new(
      opts:
        | {
            seqId: string;
            // @ts-ignore : 'VariableDeclaration' found in JSON Spec
            locals?: [VariableDeclaration, ...VariableDeclaration[]];
            // @ts-ignore : 'Metadata' found in JSON Spec
            metadata: Metadata;
            // @ts-ignore : 'VariableDeclaration' found in JSON Spec
            parameters?: [VariableDeclaration, ...VariableDeclaration[]];
            // @ts-ignore : 'Step' found in JSON Spec
            steps?: Step[];
            // @ts-ignore : 'Request' found in JSON Spec
            requests?: Request[];
            // @ts-ignore : 'ImmediateCommand' found in JSON Spec
            immediate_commands?: ImmediateCommand[];
            // @ts-ignore : 'HardwareCommand' found in JSON Spec
            hardware_commands?: HardwareCommand[];
          }
        // @ts-ignore : 'SeqJson' found in JSON Spec
        | SeqJson,
    ): Sequence;

    // @ts-ignore : 'SeqJson' found in JSON Spec
    public toSeqJson(): SeqJson;
  }

  // @ts-ignore : 'Args' found in JSON Spec
  class CommandStem<A extends Args[] | { [argName: string]: any } = [] | {}> implements Command {
    // @ts-ignore : 'Args' found in JSON Spec
    args: Args;
    stem: string;
    // @ts-ignore : 'TIME' found in JSON Spec
    time: Time;
    type: 'command';

    public static new<A extends any[] | { [argName: string]: any }>(opts: CommandOptions<A>): CommandStem<A>;

    // @ts-ignore : 'Command' found in JSON Spec
    public toSeqJson(): Command;

    // @ts-ignore : 'Model' found in JSON Spec
    public MODELS(models: Model[]): CommandStem<A>;
    // @ts-ignore : 'Model' found in JSON Spec
    public GET_MODELS(): Model[] | undefined;

    // @ts-ignore : 'Metadata' found in JSON Spec
    public METADATA(metadata: Metadata): CommandStem<A>;
    // @ts-ignore : 'Metadata' found in JSON Spec
    public GET_METADATA(): Metadata | undefined;

    // @ts-ignore : 'Description' found in JSON Spec
    public DESCRIPTION(description: Description): CommandStem<A>;
    // @ts-ignore : 'Description' found in JSON Spec
    public GET_DESCRIPTION(): Description | undefined;
  }

  // @ts-ignore : 'ARGS' found in JSON Spec
  class ImmediateStem<A extends Args[] | { [argName: string]: any } = [] | {}> implements ImmediateCommand {
    // @ts-ignore : 'Args' found in JSON Spec
    args: Args;
    stem: string;

    public static new<A extends any[] | { [argName: string]: any }>(opts: ImmediateOptions<A>): ImmediateStem<A>;

    // @ts-ignore : 'Command' found in JSON Spec
    public toSeqJson(): ImmediateCommand;

    // @ts-ignore : 'Metadata' found in JSON Spec
    public METADATA(metadata: Metadata): ImmediateStem<A>;
    // @ts-ignore : 'Metadata' found in JSON Spec
    public GET_METADATA(): Metadata | undefined;

    // @ts-ignore : 'Description' found in JSON Spec
    public DESCRIPTION(description: Description): ImmediateStem<A>;
    // @ts-ignore : 'Description' found in JSON Spec
    public GET_DESCRIPTION(): Description | undefined;
  }

  // @ts-ignore : 'HardwareCommand' found in JSON Spec
  class HardwareStem implements HardwareCommand {
    stem: string;

    public static new(opts: HardwareOptions): HardwareStem;

    // @ts-ignore : 'Command' found in JSON Spec
    public toSeqJson(): HardwareCommand;

    // @ts-ignore : 'Metadata' found in JSON Spec
    public METADATA(metadata: Metadata): HardwareStem;
    // @ts-ignore : 'Metadata' found in JSON Spec
    public GET_METADATA(): Metadata | undefined;

    // @ts-ignore : 'Description' found in JSON Spec
    public DESCRIPTION(description: Description): HardwareStem;
    // @ts-ignore : 'Description' found in JSON Spec
    public GET_DESCRIPTION(): Description | undefined;
  }

  const STEPS: {
    GROUND_BLOCK: typeof GROUND_BLOCK;
    GROUND_EVENT: typeof GROUND_EVENT;
  };

  type Context = {};
  type ExpansionReturn = Arrayable<CommandStem>;

  type U<BitLength extends 8 | 16 | 32 | 64> = number;
  type U8 = U<8>;
  type U16 = U<16>;
  type U32 = U<32>;
  type U64 = U<64>;
  type I<BitLength extends 8 | 16 | 32 | 64> = number;
  type I8 = I<8>;
  type I16 = I<16>;
  type I32 = I<32>;
  type I64 = I<64>;
  type VarString<PrefixBitLength extends number, MaxBitLength extends number> = string;
  type FixedString = string;
  type F<BitLength extends 32 | 64> = number;
  type F32 = F<32>;
  type F64 = F<64>;

  // @ts-ignore : 'Commands' found in generated code
  function A(...args: [TemplateStringsArray, ...string[]]): typeof Commands & typeof STEPS;
  // @ts-ignore : 'Commands' found in generated code
  function A(absoluteTime: Temporal.Instant): typeof Commands & typeof STEPS;
  // @ts-ignore : 'Commands' found in generated code
  function A(timeDOYString: string): typeof Commands & typeof STEPS;

  // @ts-ignore : 'Commands' found in generated code
  function R(...args: [TemplateStringsArray, ...string[]]): typeof Commands & typeof STEPS;
  // @ts-ignore : 'Commands' found in generated code
  function R(duration: Temporal.Duration): typeof Commands & typeof STEPS;
  // @ts-ignore : 'Commands' found in generated code
  function R(timeHMSString: string): typeof Commands & typeof STEPS;

  // @ts-ignore : 'Commands' found in generated code
  function E(...args: [TemplateStringsArray, ...string[]]): typeof Commands & typeof STEPS;
  // @ts-ignore : 'Commands' found in generated code
  function E(duration: Temporal.Duration): typeof Commands & typeof STEPS;
  // @ts-ignore : 'Commands' found in generated code
  function E(timeHMSString: string): typeof Commands & typeof STEPS;

  // @ts-ignore : 'Commands' found in generated code
  const C: typeof Commands & typeof STEPS;
}

/*
            ---------------------------------
                        Sequence eDSL
            ---------------------------------
            */
// @ts-ignore : 'SeqJson' found in JSON Spec
export class Sequence implements SeqJson {
  public readonly id: string;
  // @ts-ignore : 'Metadata' found in JSON Spec
  public readonly metadata: Metadata;

  // @ts-ignore : 'VariableDeclaration' found in JSON Spec
  public readonly locals?: [VariableDeclaration, ...VariableDeclaration[]];
  // @ts-ignore : 'VariableDeclaration' found in JSON Spec
  public readonly parameters?: [VariableDeclaration, ...VariableDeclaration[]];
  // @ts-ignore : 'Step' found in JSON Spec
  public readonly steps?: Step[];
  // @ts-ignore : 'Request' found in JSON Spec
  public readonly requests?: Request[];
  // @ts-ignore : 'ImmediateCommand' found in JSON Spec
  public readonly immediate_commands?: ImmediateCommand[];
  // @ts-ignore : 'HardwareCommand' found in JSON Spec
  public readonly hardware_commands?: HardwareCommand[];
  [k: string]: unknown;

  // @ts-ignore : 'SeqJson' found in JSON Spec
  private constructor(opts: SequenceOptions | SeqJson) {
    if ('id' in opts) {
      this.id = opts.id;
    } else {
      this.id = opts.seqId;
    }
    this.metadata = opts.metadata;

    this.locals = opts.locals ?? undefined;
    this.parameters = opts.parameters ?? undefined;
    this.steps = opts.steps ?? undefined;
    this.requests = opts.requests ?? undefined;
    this.immediate_commands = opts.immediate_commands ?? undefined;
    this.hardware_commands = opts.hardware_commands ?? undefined;
  }
  public static new(opts: SequenceOptions): Sequence {
    return new Sequence(opts);
  }

  // @ts-ignore : 'SeqJson' found in JSON Spec
  public toSeqJson(): SeqJson {
    return {
      id: this.id,
      metadata: this.metadata,
      ...(this.steps
        ? {
            steps: this.steps.map(step => {
              if (step instanceof CommandStem || step instanceof Ground_Block || step instanceof Ground_Event)
                return step.toSeqJson();
              return step;
            }),
          }
        : {}),
      ...(this.locals ? { locals: this.locals } : {}),
      ...(this.parameters ? { parameters: this.parameters } : {}),
      ...(this.requests
        ? {
            requests: this.requests.map(request => {
              return {
                name: request.name,
                steps: [
                  request.steps[0] instanceof CommandStem ||
                  request.steps[0] instanceof Ground_Block ||
                  request.steps[0] instanceof Ground_Event
                    ? request.steps[0].toSeqJson()
                    : request.steps[0],
                  // @ts-ignore : 'step' found in JSON Spec
                  ...request.steps.slice(1).map(step => {
                    if (step instanceof CommandStem || step instanceof Ground_Block || step instanceof Ground_Event)
                      return step.toSeqJson();
                    return step;
                  }),
                ],
                type: request.type,
                ...(request.description ? { description: request.description } : {}),
                ...(request.ground_epoch ? { ground_epoch: request.ground_epoch } : {}),
                ...(request.time ? { time: request.time } : {}),
                ...(request.metadata ? { metadata: request.metadata } : {}),
              };
            }),
          }
        : {}),
      ...(this.immediate_commands
        ? {
            immediate_commands: this.immediate_commands.map(command => {
              if (command instanceof ImmediateStem) return command.toSeqJson();
              if (command instanceof CommandStem)
                return {
                  args: [
                    {
                      name: 'message',
                      type: 'string',
                      value: `ERROR: ${command.toEDSLString()}, is not an immediate command.`,
                    },
                  ],
                  stem: '$$ERROR$$',
                };
              else return command;
            }),
          }
        : {}),
      ...(this.hardware_commands
        ? {
            hardware_commands: this.hardware_commands.map(h => {
              return h instanceof HardwareStem ? h.toSeqJson() : h;
            }),
          }
        : {}),
    };
  }

  public toEDSLString(): string {
    const commandsString =
      this.steps && this.steps.length > 0
        ? '[\n' +
          indent(
            this.steps
              .map(step => {
                if (step instanceof CommandStem || step instanceof Ground_Block || step instanceof Ground_Event) {
                  return step.toEDSLString() + ',';
                }
                return objectToString(step) + ',';
              })
              .join('\n'),
            1,
          ) +
          '\n]'
        : '';
    //ex.
    // [C.ADD_WATER]
    const metadataString = Object.keys(this.metadata).length == 0 ? `{}` : `${objectToString(this.metadata)}`;

    const localsString = this.locals ? `[\n${indent(this.locals.map(l => objectToString(l)).join(',\n'), 1)}\n]` : '';

    const parameterString = this.parameters
      ? `[\n${indent(this.parameters.map(l => objectToString(l)).join(',\n'), 1)}\n]`
      : '';
    //ex.
    // `parameters: [
    //   {
    //     allowable_ranges: [
    //       {
    //         max: 3600,
    //         min: 1,
    //       },
    //     ],
    //     name: 'duration',
    //     type: 'UINT',
    //   }
    // ]`;

    const hardwareString = this.hardware_commands
      ? `[\n${indent(this.hardware_commands.map(h => (h as HardwareStem).toEDSLString()).join(',\n'), 1)}\n]`
      : '';
    //ex.
    // hardware_commands: [
    //   {
    //     description: 'FIRE THE PYROS',
    //     metadata:{
    //       author: 'rrgoetz',
    //     },
    //     stem: 'HDW_PYRO_ENGINE',
    //   }
    // ],

    const immediateString =
      this.immediate_commands && this.immediate_commands.length > 0
        ? '[\n' +
          indent(
            this.immediate_commands
              .map(command => {
                if (command instanceof ImmediateStem) {
                  return command.toEDSLString() + ',';
                }
                return objectToString(command) + ',';
              })
              .join('\n'),
            1,
          ) +
          '\n]'
        : '';
    //ex.
    // immediate_commands: [
    //   {
    //     args: [
    //       {
    //         name: 'direction',
    //         type: 'string',
    //         value: 'FromStem',
    //       },
    //     ],
    //     stem: 'PEEL_BANANA',
    //   }
    // ]

    const requestString = this.requests
      ? `[\n${indent(
          this.requests
            .map(r => {
              return (
                `{\n` +
                indent(
                  `name: '${r.name}',\n` +
                    `steps: [\n${indent(
                      r.steps
                        // @ts-ignore : 's: Step' found in JSON Spec
                        .map(s => {
                          if (s instanceof CommandStem || s instanceof Ground_Block || s instanceof Ground_Event) {
                            return s.toEDSLString() + ',';
                          }
                          return objectToString(s) + ',';
                        })
                        .join('\n'),
                      1,
                    )}\n],` +
                    `\ntype: '${r.type}',` +
                    `${r.description ? `\ndescription: '${r.description}',` : ''}` +
                    `${r.ground_epoch ? `\nground_epoch: ${objectToString(r.ground_epoch)},` : ''}` +
                    `${r.time ? `\ntime: ${objectToString(r.time)},` : ''}` +
                    `${r.metadata ? `\nmetadata: ${objectToString(r.metadata)},` : ''}`,
                  1,
                ) +
                `\n}`
              );
            })
            .join(',\n'),
          1,
        )}\n]`
      : '';
    //ex.
    /*requests: [
      {
        name: 'power',
        steps: [
        R`04:39:22.000`.PREHEAT_OVEN({
        temperature: 360,
        }),
        C.ADD_WATER,
        ],
        type: 'request',
        description: ' Activate the oven',
        ground_epoch: {
        delta: 'now',
        name: 'activate',
        },
        metadata: {
        author: 'rrgoet',
        },
      }
      ]
      }*/

    return (
      `export default () =>\n` +
      `${indent(`Sequence.new({`, 1)}\n` +
      `${indent(`seqId: '${this.id}'`, 2)},\n` +
      `${indent(`metadata: ${metadataString}`, 2)},\n` +
      `${localsString.length !== 0 ? `${indent(`locals: ${localsString}`, 2)},\n` : ''}` +
      `${parameterString.length !== 0 ? `${indent(`parameters: ${parameterString}`, 2)},\n` : ''}` +
      `${commandsString.length !== 0 ? `${indent(`steps: ${commandsString}`, 2)},\n` : ''}` +
      `${hardwareString.length !== 0 ? `${indent(`hardware_commands: ${hardwareString}`, 2)},\n` : ''}` +
      `${immediateString.length !== 0 ? `${indent(`immediate_commands: ${immediateString}`, 2)},\n` : ''}` +
      `${requestString.length !== 0 ? `${indent(`requests: ${requestString}`, 2)},\n` : ''}` +
      `${indent(`});`, 1)}`
    );
  }

  // @ts-ignore : 'Args' found in JSON Spec
  public static fromSeqJson(json: SeqJson): Sequence {
    return Sequence.new({
      seqId: json.id,
      metadata: json.metadata,
      // @ts-ignore : 'Step' found in JSON Spec
      ...(json.steps
        ? {
            // @ts-ignore : 'Step' found in JSON Spec
            steps: json.steps.map((c: Step) => {
              if (c.type === 'command') return CommandStem.fromSeqJson(c as CommandStem);
              else if (c.type === 'ground_block') return Ground_Block.fromSeqJson(c as Ground_Block);
              else if (c.type === 'ground_event') return Ground_Event.fromSeqJson(c as Ground_Event);
              return c;
            }),
          }
        : {}),
      ...(json.locals ? { locals: json.locals } : {}),
      ...(json.parameters ? { parameters: json.parameters } : {}),
      ...(json.requests
        ? {
            // @ts-ignore : 'r: Request' found in JSON Spec
            requests: json.requests.map(r => {
              return {
                name: r.name,
                type: r.type,
                ...(r.description ? { description: r.description } : {}),
                ...(r.ground_epoch ? { ground_epoch: r.ground_epoch } : {}),
                ...(r.time ? { time: r.time } : {}),
                ...(r.metadata ? { metadata: r.metadata } : {}),
                steps: [
                  r.steps[0].type === 'command'
                    ? CommandStem.fromSeqJson(r.steps[0] as CommandStem)
                    : r.steps[0].type === 'ground_block'
                    ? // @ts-ignore : 'GroundBlock' found in JSON Spec
                      Ground_Block.fromSeqJson(r.steps[0] as GroundBlock)
                    : r.steps[0].type === 'ground_event'
                    ? // @ts-ignore : 'GroundEvent' found in JSON Spec
                      Ground_Event.fromSeqJson(r.steps[0] as GroundEvent)
                    : r.steps[0],
                  // @ts-ignore : 'step : Step' found in JSON Spec
                  ...r.steps.slice(1).map(step => {
                    if (step.type === 'command') return CommandStem.fromSeqJson(step as CommandStem);
                    else if (step.type === 'ground_block') return Ground_Block.fromSeqJson(step as Ground_Block);
                    else if (step.type === 'ground_event') return Ground_Event.fromSeqJson(step as Ground_Event);
                    return step;
                  }),
                ],
              };
            }),
          }
        : {}),
      ...(json.immediate_commands
        ? {
            // @ts-ignore : 'Step' found in JSON Spec
            immediate_commands: json.immediate_commands.map((c: ImmediateCommand) => ImmediateStem.fromSeqJson(c)),
          }
        : {}),
      ...(json.hardware_commands
        ? // @ts-ignore : 'HardwareCommand' found in JSON Spec
          {
            hardware_commands: json.hardware_commands.map((h: HardwareCommand) => HardwareStem.fromSeqJson(h)),
          }
        : {}),
    });
  }
}

/*
        ---------------------------------
                    STEPS eDSL
        ---------------------------------
        */

// @ts-ignore : 'Args' found in JSON Spec
export class CommandStem<A extends Args[] | { [argName: string]: any } = [] | {}> implements Command {
  public readonly arguments: A;
  public readonly absoluteTime: Temporal.Instant | null = null;
  public readonly epochTime: Temporal.Duration | null = null;
  public readonly relativeTime: Temporal.Duration | null = null;

  public readonly stem: string;
  // @ts-ignore : 'Args' found in JSON Spec
  public readonly args!: Args;
  // @ts-ignore : 'Time' found in JSON Spec
  public readonly time!: Time;
  // @ts-ignore : 'Model' found in JSON Spec
  private readonly _models?: Model[] | undefined;
  // @ts-ignore : 'Metadata' found in JSON Spec
  private readonly _metadata?: Metadata | undefined;
  // @ts-ignore : 'Description' found in JSON Spec
  private readonly _description?: Description | undefined;
  public readonly type: 'command' = 'command';

  private constructor(opts: CommandOptions<A>) {
    this.stem = opts.stem;
    this.arguments = opts.arguments;

    if ('absoluteTime' in opts) {
      this.absoluteTime = opts.absoluteTime;
    } else if ('epochTime' in opts) {
      this.epochTime = opts.epochTime;
    } else if ('relativeTime' in opts) {
      this.relativeTime = opts.relativeTime;
    }
    this._metadata = opts.metadata;
    this._description = opts.description;
    this._models = opts.models;
  }

  public static new<A extends any[] | { [argName: string]: any }>(opts: CommandOptions<A>): CommandStem<A> {
    if ('absoluteTime' in opts) {
      return new CommandStem<A>({
        ...opts,
        absoluteTime: opts.absoluteTime,
      });
    } else if ('epochTime' in opts) {
      return new CommandStem<A>({
        ...opts,
        epochTime: opts.epochTime,
      });
    } else if ('relativeTime' in opts) {
      return new CommandStem<A>({
        ...opts,
        relativeTime: opts.relativeTime,
      });
    } else {
      return new CommandStem<A>(opts);
    }
  }

  // @ts-ignore : 'Model' found in JSON Spec
  public MODELS(models: Model[]): CommandStem {
    return CommandStem.new({
      stem: this.stem,
      arguments: this.arguments,
      models: models,
      metadata: this._metadata,
      description: this._description,
      ...(this.absoluteTime && { absoluteTime: this.absoluteTime }),
      ...(this.epochTime && { epochTime: this.epochTime }),
      ...(this.relativeTime && { relativeTime: this.relativeTime }),
    });
  }

  // @ts-ignore : 'Model' found in JSON Spec
  public GET_MODELS(): Model[] | undefined {
    return this._models;
  }

  // @ts-ignore : 'Metadata' found in JSON Spec
  public METADATA(metadata: Metadata): CommandStem {
    return CommandStem.new({
      stem: this.stem,
      arguments: this.arguments,
      models: this._models,
      metadata: metadata,
      description: this._description,
      ...(this.absoluteTime && { absoluteTime: this.absoluteTime }),
      ...(this.epochTime && { epochTime: this.epochTime }),
      ...(this.relativeTime && { relativeTime: this.relativeTime }),
    });
  }

  // @ts-ignore : 'Metadata' found in JSON Spec
  public GET_METADATA(): Metadata | undefined {
    return this._metadata;
  }

  // @ts-ignore : 'Description' found in JSON Spec
  public DESCRIPTION(description: Description): CommandStem {
    return CommandStem.new({
      stem: this.stem,
      arguments: this.arguments,
      models: this._models,
      metadata: this._metadata,
      description: description,
      ...(this.absoluteTime && { absoluteTime: this.absoluteTime }),
      ...(this.epochTime && { epochTime: this.epochTime }),
      ...(this.relativeTime && { relativeTime: this.relativeTime }),
    });
  }
  // @ts-ignore : 'Description' found in JSON Spec
  public GET_DESCRIPTION(): Description | undefined {
    return this._description;
  }

  // @ts-ignore : 'Command' found in JSON Spec
  public toSeqJson(): Command {
    return {
      args: convertArgsToInterfaces(this.arguments),
      stem: this.stem,
      time:
        this.absoluteTime !== null
          ? { type: TimingTypes.ABSOLUTE, tag: instantToDoy(this.absoluteTime) }
          : this.epochTime !== null
          ? {
              type: TimingTypes.EPOCH_RELATIVE,
              tag: durationToHms(this.epochTime),
            }
          : this.relativeTime !== null
          ? {
              type: TimingTypes.COMMAND_RELATIVE,
              tag: durationToHms(this.relativeTime),
            }
          : { type: TimingTypes.COMMAND_COMPLETE },
      type: this.type,
      ...(this._metadata ? { metadata: this._metadata } : {}),
      ...(this._models ? { models: this._models } : {}),
      ...(this._description ? { description: this._description } : {}),
    };
  }

  // @ts-ignore : 'Command' found in JSON Spec
  public static fromSeqJson(json: Command): CommandStem {
    const timeValue =
      json.time.type === TimingTypes.ABSOLUTE
        ? { absoluteTime: doyToInstant(json.time.tag as DOY_STRING) }
        : json.time.type === TimingTypes.COMMAND_RELATIVE
        ? { relativeTime: hmsToDuration(json.time.tag as HMS_STRING) }
        : json.time.type === TimingTypes.EPOCH_RELATIVE
        ? { epochTime: hmsToDuration(json.time.tag as HMS_STRING) }
        : {};

    return CommandStem.new({
      stem: json.stem,
      arguments: convertInterfacesToArgs(json.args),
      metadata: json.metadata,
      models: json.models,
      description: json.description,
      ...timeValue,
    });
  }

  public absoluteTiming(absoluteTime: Temporal.Instant): CommandStem<A> {
    return CommandStem.new({
      stem: this.stem,
      arguments: this.arguments,
      absoluteTime: absoluteTime,
    });
  }

  public epochTiming(epochTime: Temporal.Duration): CommandStem<A> {
    return CommandStem.new({
      stem: this.stem,
      arguments: this.arguments,
      epochTime: epochTime,
    });
  }

  public relativeTiming(relativeTime: Temporal.Duration): CommandStem<A> {
    return CommandStem.new({
      stem: this.stem,
      arguments: this.arguments,
      relativeTime: relativeTime,
    });
  }

  public toEDSLString(): string {
    const timeString = this.absoluteTime
      ? `A\`${instantToDoy(this.absoluteTime)}\``
      : this.epochTime
      ? `E\`${durationToHms(this.epochTime)}\``
      : this.relativeTime
      ? `R\`${durationToHms(this.relativeTime)}\``
      : 'C';

    const argsString = Object.keys(this.arguments).length === 0 ? '' : `(${argumentsToString(this.arguments)})`;

    const metadata =
      this._metadata && Object.keys(this._metadata).length !== 0
        ? `\n.METADATA(${objectToString(this._metadata)})`
        : '';
    const description =
      this._description && this._description.length !== 0 ? `\n.DESCRIPTION('${this._description}')` : '';
    const models =
      this._models && Object.keys(this._models).length !== 0
        ? `\n.MODELS([\n${this._models.map(m => indent(objectToString(m))).join(',\n')}\n])`
        : '';
    return `${timeString}.${this.stem}${argsString}${description}${metadata}${models}`;
  }
}

// @ts-ignore : 'Args' found in JSON Spec
export class ImmediateStem<A extends Args[] | { [argName: string]: any } = [] | {}> implements ImmediateCommand {
  public readonly arguments: A;
  public readonly stem: string;
  // @ts-ignore : 'Args' found in JSON Spec
  public readonly args!: Args;
  // @ts-ignore : 'Metadata' found in JSON Spec
  private readonly _metadata?: Metadata | undefined;
  // @ts-ignore : 'Description' found in JSON Spec
  private readonly _description?: Description | undefined;

  private constructor(opts: ImmediateOptions<A>) {
    this.stem = opts.stem;
    this.arguments = opts.arguments;
    this._metadata = opts.metadata;
    this._description = opts.description;
  }

  public static new<A extends any[] | { [argName: string]: any }>(opts: ImmediateOptions<A>): ImmediateStem<A> {
    return new ImmediateStem<A>(opts);
  }

  // @ts-ignore : 'Metadata' found in JSON Spec
  public METADATA(metadata: Metadata): ImmediateStem {
    return ImmediateStem.new({
      stem: this.stem,
      arguments: this.arguments,
      metadata: metadata,
      description: this._description,
    });
  }

  // @ts-ignore : 'Metadata' found in JSON Spec
  public GET_METADATA(): Metadata | undefined {
    return this._metadata;
  }

  // @ts-ignore : 'Description' found in JSON Spec
  public DESCRIPTION(description: Description): ImmediateStem {
    return ImmediateStem.new({
      stem: this.stem,
      arguments: this.arguments,
      metadata: this._metadata,
      description: description,
    });
  }
  // @ts-ignore : 'Description' found in JSON Spec
  public GET_DESCRIPTION(): Description | undefined {
    return this._description;
  }

  // @ts-ignore : 'Command' found in JSON Spec
  public toSeqJson(): ImmediateCommand {
    return {
      args: convertArgsToInterfaces(this.arguments),
      stem: this.stem,
      ...(this._metadata ? { metadata: this._metadata } : {}),
      ...(this._description ? { description: this._description } : {}),
    };
  }

  // @ts-ignore : 'Command' found in JSON Spec
  public static fromSeqJson(json: ImmediateCommand): ImmediateStem {
    return ImmediateStem.new({
      stem: json.stem,
      arguments: convertInterfacesToArgs(json.args),
      metadata: json.metadata,
      description: json.description,
    });
  }

  public toEDSLString(): string {
    const argsString = Object.keys(this.arguments).length === 0 ? '' : `(${argumentsToString(this.arguments)})`;

    const metadata =
      this._metadata && Object.keys(this._metadata).length !== 0
        ? `\n.METADATA(${objectToString(this._metadata)})`
        : '';
    const description =
      this._description && this._description.length !== 0 ? `\n.DESCRIPTION('${this._description}')` : '';

    return `${this.stem}${argsString}${description}${metadata}`;
  }
}

//The function takes an object of arguments and converts them into the Args type. It does this by looping through the
// values and pushing a new argument type to the result array depending on the type of the value.
// If the value is an array, it will create a RepeatArgument type and recursively call on the values of the array.
// the function returns the result array of argument types -
// StringArgument, NumberArgument, BooleanArgument, SymbolArgument, HexArgument, and RepeatArgument.
// @ts-ignore : 'Args' found in JSON Spec
function convertArgsToInterfaces(args: { [argName: string]: any }): Args {
  // @ts-ignore : 'Args' found in JSON Spec
  let result: Args = [];
  if (args['length'] === 0) {
    return result;
  }

  const values = Array.isArray(args) ? args[0] : args;

  for (let key in values) {
    let value = values[key];
    if (Array.isArray(value)) {
      // @ts-ignore : 'RepeatArgument' found in JSON Spec
      let repeatArg: RepeatArgument = {
        value: value.map(arg => {
          return convertRepeatArgs(arg);
        }),
        type: 'repeat',
        name: key,
      };
      result.push(repeatArg);
    } else {
      result = result.concat(convertValueToObject(value, key));
    }
  }
  return result;
}

// @ts-ignore : 'GroundBlock' found in JSON Spec
export class Ground_Block implements GroundBlock {
  name: string;
  // @ts-ignore : 'Time' found in JSON Spec
  time!: Time;
  type: 'ground_block' = 'ground_block';

  private readonly _absoluteTime: Temporal.Instant | null = null;
  private readonly _epochTime: Temporal.Duration | null = null;
  private readonly _relativeTime: Temporal.Duration | null = null;

  // @ts-ignore : 'Args' found in JSON Spec
  private readonly _args: Args | undefined;
  // @ts-ignore : 'Description' found in JSON Spec
  private readonly _description: Description | undefined;
  // @ts-ignore : 'Metadata' found in JSON Spec
  private readonly _metadata: Metadata | undefined;
  // @ts-ignore : 'Model' found in JSON Spec
  private readonly _models: Model[] | undefined;

  constructor(opts: GroundOptions) {
    this.name = opts.name;

    this._args = opts.args ?? undefined;
    this._description = opts.description ?? undefined;
    this._metadata = opts.metadata ?? undefined;
    this._models = opts.models ?? undefined;

    if ('absoluteTime' in opts) {
      this._absoluteTime = opts.absoluteTime;
    } else if ('epochTime' in opts) {
      this._epochTime = opts.epochTime;
    } else if ('relativeTime' in opts) {
      this._relativeTime = opts.relativeTime;
    }
  }

  public static new(opts: GroundOptions): Ground_Block {
    return new Ground_Block(opts);
  }

  public absoluteTiming(absoluteTime: Temporal.Instant): Ground_Block {
    return new Ground_Block({
      ...(this._args ? { args: this._args } : {}),
      ...(this._description ? { description: this._description } : {}),
      ...(this._metadata ? { metadata: this._metadata } : {}),
      ...(this._models ? { model: this._models } : {}),
      name: this.name,
      absoluteTime: absoluteTime,
    });
  }

  public epochTiming(epochTime: Temporal.Duration): Ground_Block {
    return new Ground_Block({
      ...(this._args ? { args: this._args } : {}),
      ...(this._description ? { description: this._description } : {}),
      ...(this._metadata ? { metadata: this._metadata } : {}),
      ...(this._models ? { model: this._models } : {}),
      name: this.name,
      epochTime: epochTime,
    });
  }

  public relativeTiming(relativeTime: Temporal.Duration): Ground_Block {
    return new Ground_Block({
      ...(this._args ? { args: this._args } : {}),
      ...(this._description ? { description: this._description } : {}),
      ...(this._metadata ? { metadata: this._metadata } : {}),
      ...(this._models ? { model: this._models } : {}),
      name: this.name,
      relativeTime: relativeTime,
    });
  }

  // @ts-ignore : 'Model' found in JSON Spec
  public MODELS(models: Model[]): Ground_Block {
    return Ground_Block.new({
      name: this.name,
      models: models,
      ...(this._args && { args: this._args }),
      ...(this._description && { description: this._description }),
      ...(this._metadata && { metadata: this._metadata }),
      ...(this._absoluteTime && { absoluteTime: this._absoluteTime }),
      ...(this._epochTime && { epochTime: this._epochTime }),
      ...(this._relativeTime && { relativeTime: this._relativeTime }),
    });
  }

  // @ts-ignore : 'Model' found in JSON Spec
  public GET_MODELS(): Model[] | undefined {
    return this._models;
  }

  // @ts-ignore : 'Metadata' found in JSON Spec
  public METADATA(metadata: Metadata): Ground_Block {
    return Ground_Block.new({
      name: this.name,
      ...(this._models && { models: this._models }),
      ...(this._args && { args: this._args }),
      ...(this._description && { description: this._description }),
      metadata: metadata,
      ...(this._absoluteTime && { absoluteTime: this._absoluteTime }),
      ...(this._epochTime && { epochTime: this._epochTime }),
      ...(this._relativeTime && { relativeTime: this._relativeTime }),
    });
  }

  // @ts-ignore : 'Metadata' found in JSON Spec
  public GET_METADATA(): Metadata | undefined {
    return this._metadata;
  }

  // @ts-ignore : 'Description' found in JSON Spec
  public DESCRIPTION(description: Description): Ground_Block {
    return Ground_Block.new({
      name: this.name,
      ...(this._models && { models: this._models }),
      ...(this._args && { args: this._args }),
      description: description,
      ...(this._metadata && { metadata: this._metadata }),
      ...(this._absoluteTime && { absoluteTime: this._absoluteTime }),
      ...(this._epochTime && { epochTime: this._epochTime }),
      ...(this._relativeTime && { relativeTime: this._relativeTime }),
    });
  }
  // @ts-ignore : 'Description' found in JSON Spec
  public GET_DESCRIPTION(): Description | undefined {
    return this._description;
  }

  // @ts-ignore : 'Description' found in JSON Spec
  public ARGUMENTS(args: Args): Ground_Block {
    return Ground_Block.new({
      name: this.name,
      ...(this._models && { models: this._models }),
      args: args,
      ...(this._description && { description: this._description }),
      ...(this._metadata && { metadata: this._metadata }),
      ...(this._absoluteTime && { absoluteTime: this._absoluteTime }),
      ...(this._epochTime && { epochTime: this._epochTime }),
      ...(this._relativeTime && { relativeTime: this._relativeTime }),
    });
  }

  // @ts-ignore : 'Description' found in JSON Spec
  public GET_ARGUMENTS(): Args | undefined {
    return this._args;
  }

  // @ts-ignore : 'GroundBlock' found in JSON Spec
  public toSeqJson(): GroundBlock {
    return {
      name: this.name,
      time:
        this._absoluteTime !== null
          ? {
              type: TimingTypes.ABSOLUTE,
              tag: instantToDoy(this._absoluteTime),
            }
          : this._epochTime !== null
          ? {
              type: TimingTypes.EPOCH_RELATIVE,
              tag: durationToHms(this._epochTime),
            }
          : this._relativeTime !== null
          ? {
              type: TimingTypes.COMMAND_RELATIVE,
              tag: durationToHms(this._relativeTime),
            }
          : { type: TimingTypes.COMMAND_COMPLETE },
      ...(this._args ? { args: this._args } : {}),
      ...(this._description ? { description: this._description } : {}),
      ...(this._metadata ? { metadata: this._metadata } : {}),
      ...(this._models ? { models: this._models } : {}),
      type: this.type,
    };
  }

  // @ts-ignore : 'GroundBlock' found in JSON Spec
  public static fromSeqJson(json: GroundBlock): Ground_Block {
    const timeValue =
      json.time.type === TimingTypes.ABSOLUTE
        ? { absoluteTime: doyToInstant(json.time.tag as DOY_STRING) }
        : json.time.type === TimingTypes.COMMAND_RELATIVE
        ? { relativeTime: hmsToDuration(json.time.tag as HMS_STRING) }
        : json.time.type === TimingTypes.EPOCH_RELATIVE
        ? { epochTime: hmsToDuration(json.time.tag as HMS_STRING) }
        : {};

    return Ground_Block.new({
      name: json.name,
      ...(json.args ? { args: json.args } : {}),
      ...(json.description ? { description: json.description } : {}),
      ...(json.metadata ? { metadata: json.metadata } : {}),
      ...(json.models ? { models: json.models } : {}),
      ...timeValue,
    });
  }

  public toEDSLString(): string {
    const timeString = this._absoluteTime
      ? `A\`${instantToDoy(this._absoluteTime)}\``
      : this._epochTime
      ? `E\`${durationToHms(this._epochTime)}\``
      : this._relativeTime
      ? `R\`${durationToHms(this._relativeTime)}\``
      : 'C';

    const args =
      this._args && Object.keys(this._args).length !== 0
        ? // @ts-ignore : 'A : Args' found in JSON Spec
          `\n.ARGUMENTS([\n${this._args.map(a => indent(objectToString(a))).join(',\n')}\n])`
        : '';

    const metadata =
      this._metadata && Object.keys(this._metadata).length !== 0
        ? `\n.METADATA(${objectToString(this._metadata)})`
        : '';

    const description =
      this._description && this._description.length !== 0 ? `\n.DESCRIPTION('${this._description}')` : '';

    const models =
      this._models && Object.keys(this._models).length !== 0
        ? `\n.MODELS([\n${this._models.map(m => indent(objectToString(m))).join(',\n')}\n])`
        : '';

    return `${timeString}.GROUND_BLOCK('${this.name}')${args}${description}${metadata}${models}`;
  }
}

/**
 * This is a Ground Block step
 *
 */
function GROUND_BLOCK(name: string) {
  return new Ground_Block({ name: name });
}

// @ts-ignore : 'GroundBlock' found in JSON Spec
export class Ground_Event implements GroundEvent {
  name: string;
  // @ts-ignore : 'Time' found in JSON Spec
  time!: Time;
  type: 'ground_event' = 'ground_event';

  private readonly _absoluteTime: Temporal.Instant | null = null;
  private readonly _epochTime: Temporal.Duration | null = null;
  private readonly _relativeTime: Temporal.Duration | null = null;

  // @ts-ignore : 'Args' found in JSON Spec
  private readonly _args: Args | undefined;
  // @ts-ignore : 'Description' found in JSON Spec
  private readonly _description: Description | undefined;
  // @ts-ignore : 'Metadata' found in JSON Spec
  private readonly _metadata: Metadata | undefined;
  // @ts-ignore : 'Model' found in JSON Spec
  private readonly _models: Model[] | undefined;

  constructor(opts: GroundOptions) {
    this.name = opts.name;

    this._args = opts.args ?? undefined;
    this._description = opts.description ?? undefined;
    this._metadata = opts.metadata ?? undefined;
    this._models = opts.models ?? undefined;

    if ('absoluteTime' in opts) {
      this._absoluteTime = opts.absoluteTime;
    } else if ('epochTime' in opts) {
      this._epochTime = opts.epochTime;
    } else if ('relativeTime' in opts) {
      this._relativeTime = opts.relativeTime;
    }
  }

  public static new(opts: GroundOptions): Ground_Event {
    return new Ground_Event(opts);
  }

  public absoluteTiming(absoluteTime: Temporal.Instant): Ground_Event {
    return new Ground_Event({
      ...(this._args ? { args: this._args } : {}),
      ...(this._description ? { description: this._description } : {}),
      ...(this._metadata ? { metadata: this._metadata } : {}),
      ...(this._models ? { model: this._models } : {}),
      name: this.name,
      absoluteTime: absoluteTime,
    });
  }

  public epochTiming(epochTime: Temporal.Duration): Ground_Event {
    return new Ground_Event({
      ...(this._args ? { args: this._args } : {}),
      ...(this._description ? { description: this._description } : {}),
      ...(this._metadata ? { metadata: this._metadata } : {}),
      ...(this._models ? { model: this._models } : {}),
      name: this.name,
      epochTime: epochTime,
    });
  }

  public relativeTiming(relativeTime: Temporal.Duration): Ground_Event {
    return new Ground_Event({
      ...(this._args ? { args: this._args } : {}),
      ...(this._description ? { description: this._description } : {}),
      ...(this._metadata ? { metadata: this._metadata } : {}),
      ...(this._models ? { model: this._models } : {}),
      name: this.name,
      relativeTime: relativeTime,
    });
  }

  // @ts-ignore : 'Model' found in JSON Spec
  public MODELS(models: Model[]): Ground_Event {
    return Ground_Event.new({
      name: this.name,
      models: models,
      ...(this._args && { args: this._args }),
      ...(this._description && { description: this._description }),
      ...(this._metadata && { metadata: this._metadata }),
      ...(this._absoluteTime && { absoluteTime: this._absoluteTime }),
      ...(this._epochTime && { epochTime: this._epochTime }),
      ...(this._relativeTime && { relativeTime: this._relativeTime }),
    });
  }

  // @ts-ignore : 'Model' found in JSON Spec
  public GET_MODELS(): Model[] | undefined {
    return this._models;
  }

  // @ts-ignore : 'Metadata' found in JSON Spec
  public METADATA(metadata: Metadata): Ground_Event {
    return Ground_Event.new({
      name: this.name,
      ...(this._models && { models: this._models }),
      ...(this._args && { args: this._args }),
      ...(this._description && { description: this._description }),
      metadata: metadata,
      ...(this._absoluteTime && { absoluteTime: this._absoluteTime }),
      ...(this._epochTime && { epochTime: this._epochTime }),
      ...(this._relativeTime && { relativeTime: this._relativeTime }),
    });
  }

  // @ts-ignore : 'Metadata' found in JSON Spec
  public GET_METADATA(): Metadata | undefined {
    return this._metadata;
  }

  // @ts-ignore : 'Description' found in JSON Spec
  public DESCRIPTION(description: Description): Ground_Event {
    return Ground_Event.new({
      name: this.name,
      ...(this._models && { models: this._models }),
      ...(this._args && { args: this._args }),
      description: description,
      ...(this._metadata && { metadata: this._metadata }),
      ...(this._absoluteTime && { absoluteTime: this._absoluteTime }),
      ...(this._epochTime && { epochTime: this._epochTime }),
      ...(this._relativeTime && { relativeTime: this._relativeTime }),
    });
  }
  // @ts-ignore : 'Description' found in JSON Spec
  public GET_DESCRIPTION(): Description | undefined {
    return this._description;
  }

  // @ts-ignore : 'Description' found in JSON Spec
  public ARGUMENTS(args: Args): Ground_Event {
    return Ground_Event.new({
      name: this.name,
      ...(this._models && { models: this._models }),
      args: args,
      ...(this._description && { description: this._description }),
      ...(this._metadata && { metadata: this._metadata }),
      ...(this._absoluteTime && { absoluteTime: this._absoluteTime }),
      ...(this._epochTime && { epochTime: this._epochTime }),
      ...(this._relativeTime && { relativeTime: this._relativeTime }),
    });
  }

  // @ts-ignore : 'Description' found in JSON Spec
  public GET_ARGUMENTS(): Args | undefined {
    return this._args;
  }

  // @ts-ignore : 'Ground_Event' found in JSON Spec
  public toSeqJson(): GroundEvent {
    return {
      name: this.name,
      time:
        this._absoluteTime !== null
          ? {
              type: TimingTypes.ABSOLUTE,
              tag: instantToDoy(this._absoluteTime),
            }
          : this._epochTime !== null
          ? {
              type: TimingTypes.EPOCH_RELATIVE,
              tag: durationToHms(this._epochTime),
            }
          : this._relativeTime !== null
          ? {
              type: TimingTypes.COMMAND_RELATIVE,
              tag: durationToHms(this._relativeTime),
            }
          : { type: TimingTypes.COMMAND_COMPLETE },
      ...(this._args ? { args: this._args } : {}),
      ...(this._description ? { description: this._description } : {}),
      ...(this._metadata ? { metadata: this._metadata } : {}),
      ...(this._models ? { models: this._models } : {}),
      type: this.type,
    };
  }

  // @ts-ignore : 'GroundEvent' found in JSON Spec
  public static fromSeqJson(json: GroundEvent): Ground_Event {
    const timeValue =
      json.time.type === TimingTypes.ABSOLUTE
        ? { absoluteTime: doyToInstant(json.time.tag as DOY_STRING) }
        : json.time.type === TimingTypes.COMMAND_RELATIVE
        ? { relativeTime: hmsToDuration(json.time.tag as HMS_STRING) }
        : json.time.type === TimingTypes.EPOCH_RELATIVE
        ? { epochTime: hmsToDuration(json.time.tag as HMS_STRING) }
        : {};

    return Ground_Event.new({
      name: json.name,
      ...(json.args ? { args: json.args } : {}),
      ...(json.description ? { description: json.description } : {}),
      ...(json.metadata ? { metadata: json.metadata } : {}),
      ...(json.models ? { models: json.models } : {}),
      ...timeValue,
    });
  }

  public toEDSLString(): string {
    const timeString = this._absoluteTime
      ? `A\`${instantToDoy(this._absoluteTime)}\``
      : this._epochTime
      ? `E\`${durationToHms(this._epochTime)}\``
      : this._relativeTime
      ? `R\`${durationToHms(this._relativeTime)}\``
      : 'C';

    const args =
      this._args && Object.keys(this._args).length !== 0
        ? // @ts-ignore : 'A : Args' found in JSON Spec
          `\n.ARGUMENTS([\n${this._args.map(a => indent(objectToString(a))).join(',\n')}\n])`
        : '';

    const metadata =
      this._metadata && Object.keys(this._metadata).length !== 0
        ? `\n.METADATA(${objectToString(this._metadata)})`
        : '';

    const description =
      this._description && this._description.length !== 0 ? `\n.DESCRIPTION('${this._description}')` : '';

    const models =
      this._models && Object.keys(this._models).length !== 0
        ? `\n.MODELS([\n${this._models.map(m => indent(objectToString(m))).join(',\n')}\n])`
        : '';

    return `${timeString}.GROUND_EVENT('${this.name}')${args}${description}${metadata}${models}`;
  }
}

/**
 * This is a Ground Event step
 *
 */
function GROUND_EVENT(name: string) {
  return new Ground_Event({ name: name });
}

export const STEPS = {
  GROUND_BLOCK: GROUND_BLOCK,
  GROUND_EVENT: GROUND_EVENT,
};

/*-----------------------------------
          HW Commands
        ------------------------------------- */
// @ts-ignore : 'HardwareCommand' found in JSON Spec
export class HardwareStem implements HardwareCommand {
  public readonly stem: string;
  // @ts-ignore : 'Metadata' found in JSON Spec
  private readonly _metadata?: Metadata | undefined;
  // @ts-ignore : 'Description' found in JSON Spec
  private readonly _description?: Description | undefined;

  private constructor(opts: HardwareOptions) {
    this.stem = opts.stem;
    this._metadata = opts.metadata;
    this._description = opts.description;
  }

  public static new(opts: HardwareOptions): HardwareStem {
    return new HardwareStem(opts);
  }

  // @ts-ignore : 'Metadata' found in JSON Spec
  public METADATA(metadata: Metadata): HardwareStem {
    return HardwareStem.new({
      stem: this.stem,
      metadata: metadata,
      description: this._description,
    });
  }

  // @ts-ignore : 'Metadata' found in JSON Spec
  public GET_METADATA(): Metadata | undefined {
    return this._metadata;
  }

  // @ts-ignore : 'Description' found in JSON Spec
  public DESCRIPTION(description: Description): HardwareStem {
    return HardwareStem.new({
      stem: this.stem,
      metadata: this._metadata,
      description: description,
    });
  }
  // @ts-ignore : 'Description' found in JSON Spec
  public GET_DESCRIPTION(): Description | undefined {
    return this._description;
  }

  // @ts-ignore : 'Command' found in JSON Spec
  public toSeqJson(): HardwareCommand {
    return {
      stem: this.stem,
      ...(this._metadata ? { metadata: this._metadata } : {}),
      ...(this._description ? { description: this._description } : {}),
    };
  }

  // @ts-ignore : 'Command' found in JSON Spec
  public static fromSeqJson(json: HardwareCommand): HardwareStem {
    return HardwareStem.new({
      stem: json.stem,
      metadata: json.metadata,
      description: json.description,
    });
  }

  public toEDSLString(): string {
    const metadata =
      this._metadata && Object.keys(this._metadata).length !== 0
        ? `\n.METADATA(${objectToString(this._metadata)})`
        : '';
    const description =
      this._description && this._description.length !== 0 ? `\n.DESCRIPTION('${this._description}')` : '';

    return `${this.stem}${description}${metadata}`;
  }
}

/*
        ---------------------------------
                Time Utilities
        ---------------------------------
        */

export type DOY_STRING = string & { __brand: 'DOY_STRING' };
export type HMS_STRING = string & { __brand: 'HMS_STRING' };

const DOY_REGEX = /(\d{4})-(\d{3})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?/;
const HMS_REGEX = /(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?/;

/** YYYY-DOYTHH:MM:SS.sss */
export function instantToDoy(time: Temporal.Instant): DOY_STRING {
  const utcZonedDate = time.toZonedDateTimeISO('UTC');
  const YYYY = formatNumber(utcZonedDate.year, 4);
  const DOY = formatNumber(utcZonedDate.dayOfYear, 3);
  const HH = formatNumber(utcZonedDate.hour, 2);
  const MM = formatNumber(utcZonedDate.minute, 2);
  const SS = formatNumber(utcZonedDate.second, 2);
  const sss = formatNumber(utcZonedDate.millisecond, 3);
  return `${YYYY}-${DOY}T${HH}:${MM}:${SS}.${sss}` as DOY_STRING;
}

export function doyToInstant(doy: DOY_STRING): Temporal.Instant {
  const match = doy.match(DOY_REGEX);
  if (match === null) {
    throw new Error(`Invalid DOY string: ${doy}`);
  }
  const [, year, doyStr, hour, minute, second, millisecond] = match as [
    unknown,
    string,
    string,
    string,
    string,
    string,
    string | undefined,
  ];

  //use to convert doy to month and day
  const doyDate = new Date(parseInt(year, 10), 0, parseInt(doyStr, 10));
  // convert to UTC Date
  const utcDoyDate = new Date(
    Date.UTC(
      doyDate.getUTCFullYear(),
      doyDate.getUTCMonth(),
      doyDate.getUTCDate(),
      doyDate.getUTCHours(),
      doyDate.getUTCMinutes(),
      doyDate.getUTCSeconds(),
      doyDate.getUTCMilliseconds(),
    ),
  );

  return Temporal.ZonedDateTime.from({
    year: parseInt(year, 10),
    month: utcDoyDate.getUTCMonth() + 1,
    day: utcDoyDate.getUTCDate(),
    hour: parseInt(hour, 10),
    minute: parseInt(minute, 10),
    second: parseInt(second, 10),
    millisecond: parseInt(millisecond ?? '0', 10),
    timeZone: 'UTC',
  }).toInstant();
}

/** HH:MM:SS.sss */
export function durationToHms(time: Temporal.Duration): HMS_STRING {
  const HH = formatNumber(time.hours, 2);
  const MM = formatNumber(time.minutes, 2);
  const SS = formatNumber(time.seconds, 2);
  const sss = formatNumber(time.milliseconds, 3);

  return `${HH}:${MM}:${SS}.${sss}` as HMS_STRING;
}

export function hmsToDuration(hms: HMS_STRING): Temporal.Duration {
  const match = hms.match(HMS_REGEX);
  if (match === null) {
    throw new Error(`Invalid HMS string: ${hms}`);
  }
  const [, hours, minutes, seconds, milliseconds] = match as [unknown, string, string, string, string | undefined];
  return Temporal.Duration.from({
    hours: parseInt(hours, 10),
    minutes: parseInt(minutes, 10),
    seconds: parseInt(seconds, 10),
    milliseconds: parseInt(milliseconds ?? '0', 10),
  });
}

function formatNumber(number: number, size: number): string {
  return number.toString().padStart(size, '0');
}

// @ts-ignore : Used in generated code
function A(
  ...args: [TemplateStringsArray, ...string[]] | [Temporal.Instant] | [string]
): // @ts-ignore : Commands Used in generated code
typeof Commands & typeof STEPS {
  let time: Temporal.Instant;
  if (Array.isArray(args[0])) {
    time = doyToInstant(String.raw(...(args as [TemplateStringsArray, ...string[]])) as DOY_STRING);
  } else if (typeof args[0] === 'string') {
    time = doyToInstant(args[0] as DOY_STRING);
  } else {
    time = args[0] as Temporal.Instant;
  }

  return commandsWithTimeValue(time, TimingTypes.ABSOLUTE);
}

// @ts-ignore : Used in generated code
function R(
  ...args: [TemplateStringsArray, ...string[]] | [Temporal.Duration] | [string]
): // @ts-ignore : Commands Used in generated code
typeof Commands & typeof STEPS {
  let duration: Temporal.Duration;
  if (Array.isArray(args[0])) {
    duration = hmsToDuration(String.raw(...(args as [TemplateStringsArray, ...string[]])) as HMS_STRING);
  } else if (typeof args[0] === 'string') {
    duration = hmsToDuration(args[0] as HMS_STRING);
  } else {
    duration = args[0] as Temporal.Duration;
  }

  return commandsWithTimeValue(duration, TimingTypes.COMMAND_RELATIVE);
}

// @ts-ignore : Used in generated code
function E(
  ...args: [TemplateStringsArray, ...string[]] | [Temporal.Duration] | [string]
): // @ts-ignore : Commands Used in generated code
typeof Commands & typeof STEPS {
  let duration: Temporal.Duration;
  if (Array.isArray(args[0])) {
    duration = hmsToDuration(String.raw(...(args as [TemplateStringsArray, ...string[]])) as HMS_STRING);
  } else if (typeof args[0] === 'string') {
    duration = hmsToDuration(args[0] as HMS_STRING);
  } else {
    duration = args[0] as Temporal.Duration;
  }
  return commandsWithTimeValue(duration, TimingTypes.EPOCH_RELATIVE);
}

function commandsWithTimeValue<T extends TimingTypes>(
  timeValue: Temporal.Instant | Temporal.Duration,
  timeType: T,
  // @ts-ignore : Commands Used in generated code
): typeof Commands & typeof STEPS {
  return {
    // @ts-ignore : Commands Used in generated code
    ...Object.keys(Commands).reduce((accum, key) => {
      // @ts-ignore : Used in generated code
      const command = Commands[key as keyof Commands];

      if (typeof command === 'function') {
        //if (timeType === TimingTypes.ABSOLUTE) {
        accum[key] = (...args: Parameters<typeof command>): typeof command => {
          switch (timeType) {
            case TimingTypes.ABSOLUTE:
              return command(...args).absoluteTiming(timeValue);
            case TimingTypes.COMMAND_RELATIVE:
              return command(...args).relativeTiming(timeValue);
            case TimingTypes.EPOCH_RELATIVE:
              return command(...args).epochTiming(timeValue);
          }
        };
      } else {
        switch (timeType) {
          case TimingTypes.ABSOLUTE:
            accum[key] = command.absoluteTiming(timeValue);
            break;
          case TimingTypes.COMMAND_RELATIVE:
            accum[key] = command.relativeTiming(timeValue);
            break;
          case TimingTypes.EPOCH_RELATIVE:
            accum[key] = command.epochTiming(timeValue);
            break;
        }
      }

      return accum;
      // @ts-ignore : Used in generated code
    }, {} as typeof Commands),
    ...Object.keys(STEPS).reduce((accum, key) => {
      // @ts-ignore : Used in generated code
      const step = STEPS[key as keyof STEPS];
      // @ts-ignore : Used in generated code
      accum[key] = (...args: Parameters<typeof step>): typeof step => {
        switch (timeType) {
          case TimingTypes.ABSOLUTE:
            return step(...args).absoluteTiming(timeValue);
          case TimingTypes.COMMAND_RELATIVE:
            return step(...args).relativeTiming(timeValue);
          case TimingTypes.EPOCH_RELATIVE:
            return step(...args).epochTiming(timeValue);
        }
      };

      return accum;
    }, {} as typeof STEPS),
  };
}

/*
        ---------------------------------
                Utility Functions
        ---------------------------------
        */

// @ts-ignore : Used in generated code
function sortCommandArguments(args: { [argName: string]: any }, order: string[]): { [argName: string]: any } {
  if (typeof args[0] === 'object') {
    return Object.keys(args[0])
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .reduce((objectEntries: { [argName: string]: any }, key) => {
        if (Array.isArray(args[0][key])) {
          const sortedRepeatArgs = [];

          for (const test of args[0][key]) {
            sortedRepeatArgs.push(sortCommandArguments([test], order));
          }

          objectEntries[key] = sortedRepeatArgs;
        } else {
          objectEntries[key] = args[0][key];
        }

        return objectEntries;
      }, {});
  }

  return args;
}

function indent(text: string, numTimes: number = 1, char: string = '  '): string {
  return text
    .split('\n')
    .map(line => char.repeat(numTimes) + line)
    .join('\n');
}

// @ts-ignore : 'Args' found in JSON Spec
function argumentsToString<A extends Args[] | { [argName: string]: any } = [] | {}>(args: A): string {
  if (Array.isArray(args)) {
    const argStrings = args.map(arg => {
      if (typeof arg === 'string') {
        return `'${arg}'`;
      }
      return arg.toString();
    });

    return argStrings.join(', ');
  } else {
    return objectToString(args);
  }
}

/**
 * This function takes an array of Args interfaces and converts it into an object.
 * The interfaces array contains objects matching the ARGS interface.
 * Depending on the type property of each object, a corresponding object with the
 * name and value properties is created and added to the output.
 * Additionally, the function includes a validation function that prevents remote
 * property injection attacks.
 * @param interfaces
 */
// @ts-ignore : `Args` found in JSON Spec
function convertInterfacesToArgs(interfaces: Args): {} | [] {
  const args = interfaces.length === 0 ? [] : {};

  // Use to prevent a Remote property injection attack
  const validate = (input: string): boolean => {
    const pattern = /^[a-zA-Z0-9_-]+$/;
    const isValid = pattern.test(input);
    return isValid;
  };

  const convertedArgs = interfaces.map(
    (
      // @ts-ignore : found in JSON Spec
      arg: StringArgument | NumberArgument | BooleanArgument | SymbolArgument | HexArgument | RepeatArgument,
    ) => {
      // @ts-ignore : 'RepeatArgument' found in JSON Spec
      if (arg.type === 'repeat') {
        if (validate(arg.name)) {
          // @ts-ignore : 'RepeatArgument' found in JSON Spec
          return {
            [arg.name]: arg.value.map(
              (
                // @ts-ignore : found in JSON Spec
                repeatArgBundle: (StringArgument | NumberArgument | BooleanArgument | SymbolArgument | HexArgument)[],
              ) =>
                repeatArgBundle.reduce((obj, item) => {
                  if (validate(item.name)) {
                    obj[item.name] = item.value;
                  }
                  return obj;
                }, {}),
            ),
          };
        }
        return { repeat_error: 'Remote property injection detected...' };
      } else if (arg.type === 'symbol') {
        if (validate(arg.name)) {
          // @ts-ignore : 'SymbolArgument' found in JSON Spec
          return { [arg.name]: { symbol: arg.value } };
        }
        return { symbol_error: 'Remote property injection detected...' };
        // @ts-ignore : 'HexArgument' found in JSON Spec
      } else if (arg.type === 'hex') {
        if (validate(arg.name)) {
          // @ts-ignore : 'HexArgument' found in JSON Spec
          return { [arg.name]: { hex: arg.value } };
        }
        return { hex_error: 'Remote property injection detected...' };
      } else {
        if (validate(arg.name)) {
          return { [arg.name]: arg.value };
        }
        return { error: 'Remote property injection detected...' };
      }
    },
  );

  for (const key in convertedArgs) {
    Object.assign(args, convertedArgs[key]);
  }

  return args;
}

/**
 * The specific function to handle repeat args, we need to do this separately because
 * you cannot have a RepeatArgument inside a RepeatArgument.
 *
 * @param args
 * @returns
 */
function convertRepeatArgs(args: { [argName: string]: any }): any[] {
  let result: any[] = [];

  if (args['length'] === 0) {
    return result;
  }

  const values = Array.isArray(args) ? args[0] : args;

  for (let key in values) {
    result.push(convertValueToObject(values[key], key));
  }

  return result;
}

/**
 * This function takes a value and key and converts it to the correct object type supported by the seqjson spec.
 * The only type not supported here is RepeatArgument, as that is handled differently because you cannot have a
 * RepeatArgument inside a RepeatArgument.
 *
 * @param value
 * @param key
 * @returns An object for each type
 */
function convertValueToObject(value: any, key: string): any {
  switch (typeof value) {
    case 'string':
      return { type: 'string', value: value, name: key };
    case 'number':
      return { type: 'number', value: value, name: key };
    case 'boolean':
      return { type: 'boolean', value: value, name: key };
    default:
      if (value instanceof Object && value.symbol && value.symbol === 'string') {
        return { type: 'symbol', value: value, name: key };
      } else if (
        value instanceof Object &&
        value.hex &&
        value.hex === 'string' &&
        new RegExp('^0x([0-9A-F])+$').test(value.hex)
      ) {
        return { type: 'hex', value: value, name: key };
      }
  }
}

/**
 * This method takes an object and converts it to a string representation, with each
 * key-value pair on a new line and nested objects/arrays indented. The indentLevel
 * parameter specifies the initial indentation level, used to prettify the generated
 * eDSL from SeqJSON.
 * @param obj
 * @param indentLevel
 */
function objectToString(obj: any, indentLevel: number = 1): string {
  let output = '';

  const print = (obj: any) => {
    Object.keys(obj).forEach(key => {
      const value = obj[key];

      if (Array.isArray(value)) {
        output += indent(`${key}: [`, indentLevel) + '\n';
        indentLevel++;
        value.forEach((item: any) => {
          output += indent(`{`, indentLevel) + '\n';
          indentLevel++;
          print(item);
          indentLevel--;
          output += indent(`},`, indentLevel) + '\n';
        });
        indentLevel--;
        output += indent(`],`, indentLevel) + '\n';
      } else if (typeof value === 'object') {
        output += indent(`${key}:{`, indentLevel) + '\n';
        indentLevel++;
        print(value);
        indentLevel--;
        output += indent(`},`, indentLevel) + '\n';
      } else {
        output += indent(`${key}: ${typeof value === 'string' ? `'${value}'` : value},`, indentLevel) + '\n';
      }
    });
  };

  output += '{\n';
  print(obj);
  output += `}`;

  return output;
}

/** END Preface */
/** START Sequence JSON Spec */
//https://github.com/NASA-AMMOS/seq-json-schema/blob/develop/types.ts

/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type VariableDeclaration = {
  /**
   * Variable type. Allowed types: FLOAT, INT, STRING, UINT, ENUM.
   */
  type: 'FLOAT' | 'INT' | 'STRING' | 'UINT' | 'ENUM';
  /**
   * User-friendly variable names that will be mapped to FSW variable names. Must begin with a letter and contain only letters, numbers, and underscores.
   */
  name: string;
  /**
   * For enumerated type variables, the name of the corresponding FSW-defined ENUM.
   */
  enum_name?: string;
  /**
   * A list of allowable values for this variable.
   */
  allowable_values?: unknown[];
  /**
   * One or more allowable ranges of values, for FLOAT, INT, or UINT variable types.
   */
  allowable_ranges?: VariableRange[];
  /**
   * The FSW-specified name for this variable that should be used in the translated sequence, in case this must be specified. Used for variables which are specially-handled onboard such as LCS (Last Command Status)
   */
  sc_name?: string;
} & {
  [k: string]: unknown;
} & {
  [k: string]: unknown;
};
/**
 * Sequence steps can be grouped into a request, which can then be shifted or adjusted altogether as part of the request.
 */
export type Request = {
  description?: Description;
  ground_epoch?: GroundEpoch;
  metadata?: Metadata;
  /**
   * Request Name, used for tracking commands back to the original request after ground expansion. Must be unique.
   */
  name: string;
  /**
   * Sequence steps that are part of this request.
   *
   * @minItems 1
   */
  steps: [Step, ...Step[]];
  time?: Time;
  type: 'request';
} & Request1;
/**
 * Description. Can be attached to any sequence step.
 */
export type Description = string;
export type Step = Activate | Command | GroundBlock | GroundEvent | Load;
/**
 * Array of command arguments
 */
export type Args = (
  | StringArgument
  | NumberArgument
  | BooleanArgument
  | SymbolArgument
  | HexArgument
  | RepeatArgument
)[];
export type Request1 =
  | {
      [k: string]: unknown;
    }
  | {
      [k: string]: unknown;
    };

export interface SeqJson {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Local variable declarations.
   *
   * @minItems 1
   */
  locals?: [VariableDeclaration, ...VariableDeclaration[]];
  metadata: Metadata;
  /**
   * Parameter variable declarations.
   *
   * @minItems 1
   */
  parameters?: [VariableDeclaration, ...VariableDeclaration[]];
  /**
   * Commands groups into requests
   */
  requests?: Request[];
  /**
   * Sequence steps
   */
  steps?: Step[];
  /**
   * Immediate commands which are interpreted by FSW and not part of any sequence.
   */
  immediate_commands?: ImmediateCommand[];
  /**
   * Hardware commands which are not interpreted by FSW and not part of any sequence.
   */
  hardware_commands?: HardwareCommand[];
  [k: string]: unknown;
}
/**
 * A range of allowable variable values between a defined min and max, inclusive. min and max must be numbers
 */
export interface VariableRange {
  /**
   * Minimum value of the variable, inclusive
   */
  min: number;
  /**
   * Maximum value of the variable, inclusive
   */
  max: number;
}
/**
 * Flexible sequence metadata for any key-value pairs.
 */
export interface Metadata {
  [k: string]: unknown;
}
/**
 * Ground epoch object
 */
export interface GroundEpoch {
  /**
   * Epoch delta given as a duration, start time will be epoch+delta.
   */
  delta?: string;
  /**
   * Name of ground-defined epoch.
   */
  name?: string;
  [k: string]: unknown;
}
/**
 * Activate object
 */
export interface Activate {
  args?: Args;
  description?: Description;
  /**
   * Sequence target engine.
   */
  engine?: number;
  /**
   * Onboard epoch to pass to the sequence for derivation of epoch-relative timetags
   */
  epoch?: string;
  metadata?: Metadata;
  models?: Model[];
  /**
   * Onboard path and filename of sequence to be loaded.
   */
  sequence: string;
  time: Time;
  type: 'activate';
}
/**
 * A step argument containing a string.
 */
export interface StringArgument {
  /**
   * An optional string argument name.
   */
  name?: string;
  /**
   * The string type.
   */
  type: 'string';
  /**
   * A valid string value.
   */
  value: string;
}
/**
 * A step argument containing a number.
 */
export interface NumberArgument {
  /**
   * An optional number argument name.
   */
  name?: string;
  /**
   * The number type.
   */
  type: 'number';
  /**
   * The number value. The number must be valid.
   */
  value: number;
}
/**
 * A step argument containing a boolean.
 */
export interface BooleanArgument {
  /**
   * An optional boolean argument name.
   */
  name?: string;
  /**
   * The boolean type.
   */
  type: 'boolean';
  /**
   * The boolean value. The value must be all lowercase.
   */
  value: boolean;
}
/**
 * A step argument referencing a local or global variable, or some other symbolic name known to downstream modeling software (such as CONDITION in SEQGEN)
 */
export interface SymbolArgument {
  /**
   * An optional symbol argument name.
   */
  name?: string;
  /**
   * The symbol argument type.
   */
  type: 'symbol';
  /**
   * The symbolic name being referenced.
   */
  value: string;
}

/**
 * A step argument containing an unsigned integer in hexadecimal format.
 */
export interface HexArgument {
  /**
   * An optional hex argument name.
   */
  name?: string;
  /**
   * The hex type.
   */
  type: 'hex';
  /**
   * The hexadecimal integer value, as a string prefixed with 0x. Digits A-F must be uppercase.
   */
  value: string;
}
/**
 * An argument that can be repeated.
 */
export interface RepeatArgument {
  /**
   * An optional repeat argument name.
   */
  name?: string;
  /**
   * The repeat argument type.
   */
  type: 'repeat';
  /**
   * A repeat argument value.
   */
  value: (StringArgument | NumberArgument | BooleanArgument | SymbolArgument | HexArgument)[][];
}
/**
 * Model object that be included with commands to set variables for modeling purposes only, usually to direct sequence execution down a particular branch during modeling.
 */
export interface Model {
  /**
   * Duration to wait after step time to trigger model change
   */
  offset: string;
  /**
   * Value to set in variable.
   */
  value: string | number | boolean;
  /**
   * Variable to be set in the model
   */
  variable: string;
}
/**
 * Time object
 */
export interface Time {
  /**
   * Relative or absolute time. Required for ABSOLUTE, COMMAND_RELATIVE, and EPOCH_RELATIVE time tags but not COMMAND_COMPLETE.
   */
  tag?: string;
  /**
   * Allowed time types: ABSOLUTE, COMMAND_RELATIVE, EPOCH_RELATIVE, or COMMAND_COMPLETE.
   */
  type: 'ABSOLUTE' | 'COMMAND_RELATIVE' | 'EPOCH_RELATIVE' | 'COMMAND_COMPLETE';
}
/**
 * Command object
 */
export interface Command {
  args: Args;
  description?: Description;
  metadata?: Metadata;
  models?: Model[];
  /**
   * Command stem
   */
  stem: string;
  time: Time;
  type: 'command';
  /**
   * Name of a defined local variable to which the exit status of this command should be written to. For this to work, that local variable must have been defined with the 'SC_Name' property set to LCS
   */
  return_assign_to?: string;
}
/**
 * Ground blocks
 */
export interface GroundBlock {
  args?: Args;
  description?: Description;
  metadata?: Metadata;
  models?: Model[];
  /**
   * Ground block name
   */
  name: string;
  time: Time;
  type: 'ground_block';
}
/**
 * Ground events
 */
export interface GroundEvent {
  args?: Args;
  description?: Description;
  metadata?: Metadata;
  models?: Model[];
  /**
   * Ground event name
   */
  name: string;
  time: Time;
  type: 'ground_event';
}
/**
 * Load object
 */
export interface Load {
  args?: Args;
  description?: Description;
  /**
   * Sequence target engine.
   */
  engine?: number;
  /**
   * Onboard epoch to pass to the sequence for derivation of epoch-relative timetags
   */
  epoch?: string;
  metadata?: Metadata;
  models?: Model[];
  /**
   * Onboard path and filename of sequence to be loaded.
   */
  sequence: string;
  time: Time;
  type: 'load';
}
/**
 * Object representing a single Immediate Command
 */
export interface ImmediateCommand {
  args: Args;
  description?: Description;
  metadata?: Metadata;
  /**
   * Command stem
   */
  stem: string;
}
/**
 * Object representing a single Hardware Command
 */
export interface HardwareCommand {
  description?: Description;
  metadata?: Metadata;
  /**
   * Command stem
   */
  stem: string;
}

/** END Sequence JSON Spec */
declare global {
  interface ECHO_IMMEDIATE extends ImmediateStem<[[{ echo_string: VarString<8, 1024> }]]> {}
  interface ECHO_STEP extends CommandStem<[[{ echo_string: VarString<8, 1024> }]]> {}
  function ECHO(...args: [{ echo_string: VarString<8, 1024> }]): ECHO_IMMEDIATE;

  interface PREHEAT_OVEN_IMMEDIATE extends ImmediateStem<[[{ temperature: U8 }]]> {}
  interface PREHEAT_OVEN_STEP extends CommandStem<[[{ temperature: U8 }]]> {}
  function PREHEAT_OVEN(...args: [{ temperature: U8 }]): PREHEAT_OVEN_IMMEDIATE;

  interface THROW_BANANA_IMMEDIATE extends ImmediateStem<[[{ distance: U8 }]]> {}
  interface THROW_BANANA_STEP extends CommandStem<[[{ distance: U8 }]]> {}
  function THROW_BANANA(...args: [{ distance: U8 }]): THROW_BANANA_IMMEDIATE;

  interface GROW_BANANA_IMMEDIATE extends ImmediateStem<[[{ quantity: U8; durationSecs: U8 }]]> {}
  interface GROW_BANANA_STEP extends CommandStem<[[{ quantity: U8; durationSecs: U8 }]]> {}
  function GROW_BANANA(...args: [{ quantity: U8; durationSecs: U8 }]): GROW_BANANA_IMMEDIATE;

  interface GrowBanana_IMMEDIATE extends ImmediateStem<[[{ quantity: U8; durationSecs: U8 }]]> {}
  interface GrowBanana_STEP extends CommandStem<[[{ quantity: U8; durationSecs: U8 }]]> {}
  function GrowBanana(...args: [{ quantity: U8; durationSecs: U8 }]): GrowBanana_IMMEDIATE;

  interface PREPARE_LOAF_IMMEDIATE extends ImmediateStem<[[{ tb_sugar: U8; gluten_free: 'FALSE' | 'TRUE' }]]> {}
  interface PREPARE_LOAF_STEP extends CommandStem<[[{ tb_sugar: U8; gluten_free: 'FALSE' | 'TRUE' }]]> {}
  function PREPARE_LOAF(...args: [{ tb_sugar: U8; gluten_free: 'FALSE' | 'TRUE' }]): PREPARE_LOAF_IMMEDIATE;

  interface PEEL_BANANA_IMMEDIATE extends ImmediateStem<[[{ peelDirection: 'fromStem' | 'fromTip' }]]> {}
  interface PEEL_BANANA_STEP extends CommandStem<[[{ peelDirection: 'fromStem' | 'fromTip' }]]> {}
  function PEEL_BANANA(...args: [{ peelDirection: 'fromStem' | 'fromTip' }]): PEEL_BANANA_IMMEDIATE;

  /**
   * This command bakes a banana bread
   *
   */
  interface BAKE_BREAD_IMMEDIATE extends ImmediateStem<[]> {}
  interface BAKE_BREAD_STEP extends CommandStem<[]> {}
  const BAKE_BREAD: BAKE_BREAD_IMMEDIATE;

  /**
   * This command waters the banana tree
   *
   */
  interface ADD_WATER_IMMEDIATE extends ImmediateStem<[]> {}
  interface ADD_WATER_STEP extends CommandStem<[]> {}
  const ADD_WATER: ADD_WATER_IMMEDIATE;

  interface PACKAGE_BANANA_IMMEDIATE
    extends ImmediateStem<
      [
        [
          {
            lot_number: U16;
            bundle: Array<{
              bundle_name: VarString<8, 1024>;
              number_of_bananas: U8;
            }>;
          },
        ],
      ]
    > {}
  interface PACKAGE_BANANA_STEP
    extends CommandStem<
      [
        [
          {
            lot_number: U16;
            bundle: Array<{
              bundle_name: VarString<8, 1024>;
              number_of_bananas: U8;
            }>;
          },
        ],
      ]
    > {}
  function PACKAGE_BANANA(
    ...args: [
      {
        lot_number: U16;
        bundle: Array<{
          bundle_name: VarString<8, 1024>;
          number_of_bananas: U8;
        }>;
      },
    ]
  ): PACKAGE_BANANA_IMMEDIATE;

  /**
   * Pick a banana
   *
   */
  interface PICK_BANANA_IMMEDIATE extends ImmediateStem<[]> {}
  interface PICK_BANANA_STEP extends CommandStem<[]> {}
  const PICK_BANANA: PICK_BANANA_IMMEDIATE;

  /**
   * Eat a banana
   *
   */
  interface EAT_BANANA_IMMEDIATE extends ImmediateStem<[]> {}
  interface EAT_BANANA_STEP extends CommandStem<[]> {}
  const EAT_BANANA: EAT_BANANA_IMMEDIATE;

  /**
   * Dump the blender configuration file.
   *
   */
  interface HDW_BLENDER_DUMP extends HardwareStem {}
  const HDW_BLENDER_DUMP: HDW_BLENDER_DUMP;

  const Commands: {
    ECHO: typeof ECHO_STEP;
    PREHEAT_OVEN: typeof PREHEAT_OVEN_STEP;
    THROW_BANANA: typeof THROW_BANANA_STEP;
    GROW_BANANA: typeof GROW_BANANA_STEP;
    GrowBanana: typeof GrowBanana_STEP;
    PREPARE_LOAF: typeof PREPARE_LOAF_STEP;
    PEEL_BANANA: typeof PEEL_BANANA_STEP;
    BAKE_BREAD: typeof BAKE_BREAD_STEP;
    ADD_WATER: typeof ADD_WATER_STEP;
    PACKAGE_BANANA: typeof PACKAGE_BANANA_STEP;
    PICK_BANANA: typeof PICK_BANANA_STEP;
    EAT_BANANA: typeof EAT_BANANA_STEP;
  };

  const Hardwares: {
    HDW_BLENDER_DUMP: typeof HDW_BLENDER_DUMP;
  };
}

const argumentOrders = {
  ECHO: ['echo_string'],
  PREHEAT_OVEN: ['temperature'],
  THROW_BANANA: ['distance'],
  GROW_BANANA: ['quantity', 'durationSecs'],
  GrowBanana: ['quantity', 'durationSecs'],
  PREPARE_LOAF: ['tb_sugar', 'gluten_free'],
  PEEL_BANANA: ['peelDirection'],
  BAKE_BREAD: [],
  ADD_WATER: [],
  PACKAGE_BANANA: ['lot_number', 'bundle', 'bundle_name', 'number_of_bananas'],
  PICK_BANANA: [],
  EAT_BANANA: [],
};

/**
 * This command will echo back a string
 * @param echo_string String to echo back
 */
function ECHO(...args: [{ echo_string: VarString<8, 1024> }]) {
  return ImmediateStem.new({
    stem: 'ECHO',
    arguments: args,
  }) as ECHO_IMMEDIATE;
}
function ECHO_STEP(...args: [{ echo_string: VarString<8, 1024> }]) {
  return CommandStem.new({
    stem: 'ECHO',
    arguments: sortCommandArguments(args, argumentOrders['ECHO']),
  }) as ECHO_STEP;
}

/**
 * This command will turn on the oven
 * @param temperature Set the oven temperature
 */
function PREHEAT_OVEN(...args: [{ temperature: U8 }]) {
  return ImmediateStem.new({
    stem: 'PREHEAT_OVEN',
    arguments: args,
  }) as PREHEAT_OVEN_IMMEDIATE;
}
function PREHEAT_OVEN_STEP(...args: [{ temperature: U8 }]) {
  return CommandStem.new({
    stem: 'PREHEAT_OVEN',
    arguments: sortCommandArguments(args, argumentOrders['PREHEAT_OVEN']),
  }) as PREHEAT_OVEN_STEP;
}

/**
 * This command will throw a banana
 * @param distance The distance you throw the bananan
 */
function THROW_BANANA(...args: [{ distance: U8 }]) {
  return ImmediateStem.new({
    stem: 'THROW_BANANA',
    arguments: args,
  }) as THROW_BANANA_IMMEDIATE;
}
function THROW_BANANA_STEP(...args: [{ distance: U8 }]) {
  return CommandStem.new({
    stem: 'THROW_BANANA',
    arguments: sortCommandArguments(args, argumentOrders['THROW_BANANA']),
  }) as THROW_BANANA_STEP;
}

/**
 * This command will grow bananas
 * @param quantity Number of bananas to grow
 * @param durationSecs How many seconds will it take to grow
 */
function GROW_BANANA(...args: [{ quantity: U8; durationSecs: U8 }]) {
  return ImmediateStem.new({
    stem: 'GROW_BANANA',
    arguments: args,
  }) as GROW_BANANA_IMMEDIATE;
}
function GROW_BANANA_STEP(...args: [{ quantity: U8; durationSecs: U8 }]) {
  return CommandStem.new({
    stem: 'GROW_BANANA',
    arguments: sortCommandArguments(args, argumentOrders['GROW_BANANA']),
  }) as GROW_BANANA_STEP;
}

/**
 * This command will grow bananas, it's a duplicate to clash with an activity type of the same name
 * @param quantity Number of bananas to grow
 * @param durationSecs How many seconds will it take to grow
 */
function GrowBanana(...args: [{ quantity: U8; durationSecs: U8 }]) {
  return ImmediateStem.new({
    stem: 'GrowBanana',
    arguments: args,
  }) as GrowBanana_IMMEDIATE;
}
function GrowBanana_STEP(...args: [{ quantity: U8; durationSecs: U8 }]) {
  return CommandStem.new({
    stem: 'GrowBanana',
    arguments: sortCommandArguments(args, argumentOrders['GrowBanana']),
  }) as GrowBanana_STEP;
}

/**
 * This command make the banana bread dough
 * @param tb_sugar How much sugar is needed
 * @param gluten_free Do you hate flavor
 */
function PREPARE_LOAF(...args: [{ tb_sugar: U8; gluten_free: 'FALSE' | 'TRUE' }]) {
  return ImmediateStem.new({
    stem: 'PREPARE_LOAF',
    arguments: args,
  }) as PREPARE_LOAF_IMMEDIATE;
}
function PREPARE_LOAF_STEP(...args: [{ tb_sugar: U8; gluten_free: 'FALSE' | 'TRUE' }]) {
  return CommandStem.new({
    stem: 'PREPARE_LOAF',
    arguments: sortCommandArguments(args, argumentOrders['PREPARE_LOAF']),
  }) as PREPARE_LOAF_STEP;
}

/**
 * This command peels a single banana
 * @param peelDirection Which way do you peel the banana
 */
function PEEL_BANANA(...args: [{ peelDirection: 'fromStem' | 'fromTip' }]) {
  return ImmediateStem.new({
    stem: 'PEEL_BANANA',
    arguments: args,
  }) as PEEL_BANANA_IMMEDIATE;
}
function PEEL_BANANA_STEP(...args: [{ peelDirection: 'fromStem' | 'fromTip' }]) {
  return CommandStem.new({
    stem: 'PEEL_BANANA',
    arguments: sortCommandArguments(args, argumentOrders['PEEL_BANANA']),
  }) as PEEL_BANANA_STEP;
}

/**
 * This command bakes a banana bread
 *
 */
const BAKE_BREAD: BAKE_BREAD_IMMEDIATE = ImmediateStem.new({
  stem: 'BAKE_BREAD',
  arguments: [],
});
const BAKE_BREAD_STEP: BAKE_BREAD_STEP = CommandStem.new({
  stem: 'BAKE_BREAD',
  arguments: [],
});

/**
 * This command waters the banana tree
 *
 */
const ADD_WATER: ADD_WATER_IMMEDIATE = ImmediateStem.new({
  stem: 'ADD_WATER',
  arguments: [],
});
const ADD_WATER_STEP: ADD_WATER_STEP = CommandStem.new({
  stem: 'ADD_WATER',
  arguments: [],
});

/**
 * Dynamically bundle bananas into lots
 * @param lot_number Identification number assigned to a particular quantity
 * @param bundle A repeated set of strings and integer containing the arguments to the lot
 */
function PACKAGE_BANANA(
  ...args: [
    {
      lot_number: U16;
      bundle: Array<{ bundle_name: VarString<8, 1024>; number_of_bananas: U8 }>;
    },
  ]
) {
  return ImmediateStem.new({
    stem: 'PACKAGE_BANANA',
    arguments: args,
  }) as PACKAGE_BANANA_IMMEDIATE;
}
function PACKAGE_BANANA_STEP(
  ...args: [
    {
      lot_number: U16;
      bundle: Array<{ bundle_name: VarString<8, 1024>; number_of_bananas: U8 }>;
    },
  ]
) {
  return CommandStem.new({
    stem: 'PACKAGE_BANANA',
    arguments: sortCommandArguments(args, argumentOrders['PACKAGE_BANANA']),
  }) as PACKAGE_BANANA_STEP;
}

/**
 * Pick a banana
 *
 */
const PICK_BANANA: PICK_BANANA_IMMEDIATE = ImmediateStem.new({
  stem: 'PICK_BANANA',
  arguments: [],
});
const PICK_BANANA_STEP: PICK_BANANA_STEP = CommandStem.new({
  stem: 'PICK_BANANA',
  arguments: [],
});

/**
 * Eat a banana
 *
 */
const EAT_BANANA: EAT_BANANA_IMMEDIATE = ImmediateStem.new({
  stem: 'EAT_BANANA',
  arguments: [],
});
const EAT_BANANA_STEP: EAT_BANANA_STEP = CommandStem.new({
  stem: 'EAT_BANANA',
  arguments: [],
});

/**
 * Dump the blender configuration file.
 *
 */
const HDW_BLENDER_DUMP: HDW_BLENDER_DUMP = HardwareStem.new({
  stem: 'HDW_BLENDER_DUMP',
});

export const Commands = {
  ECHO: ECHO_STEP,
  PREHEAT_OVEN: PREHEAT_OVEN_STEP,
  THROW_BANANA: THROW_BANANA_STEP,
  GROW_BANANA: GROW_BANANA_STEP,
  GrowBanana: GrowBanana_STEP,
  PREPARE_LOAF: PREPARE_LOAF_STEP,
  PEEL_BANANA: PEEL_BANANA_STEP,
  BAKE_BREAD: BAKE_BREAD_STEP,
  ADD_WATER: ADD_WATER_STEP,
  PACKAGE_BANANA: PACKAGE_BANANA_STEP,
  PICK_BANANA: PICK_BANANA_STEP,
  EAT_BANANA: EAT_BANANA_STEP,
};

export const Immediates = {
  ECHO: ECHO,
  PREHEAT_OVEN: PREHEAT_OVEN,
  THROW_BANANA: THROW_BANANA,
  GROW_BANANA: GROW_BANANA,
  GrowBanana: GrowBanana,
  PREPARE_LOAF: PREPARE_LOAF,
  PEEL_BANANA: PEEL_BANANA,
  BAKE_BREAD: BAKE_BREAD,
  ADD_WATER: ADD_WATER,
  PACKAGE_BANANA: PACKAGE_BANANA,
  PICK_BANANA: PICK_BANANA,
  EAT_BANANA: EAT_BANANA,
};

export const Hardwares = {
  HDW_BLENDER_DUMP: HDW_BLENDER_DUMP,
};

Object.assign(globalThis, { A: A, R: R, E: E, C: Object.assign(Commands, STEPS), Sequence }, Hardwares, Immediates);

declare global {
  namespace Temporal {
    export type ComparisonResult = -1 | 0 | 1;
    export type RoundingMode = 'halfExpand' | 'ceil' | 'trunc' | 'floor';

    /**
     * Options for assigning fields using `with()` or entire objects with
     * `from()`.
     * */
    export type AssignmentOptions = {
      /**
       * How to deal with out-of-range values
       *
       * - In `'constrain'` mode, out-of-range values are clamped to the nearest
       *   in-range value.
       * - In `'reject'` mode, out-of-range values will cause the function to
       *   throw a RangeError.
       *
       * The default is `'constrain'`.
       */
      overflow?: 'constrain' | 'reject';
    };

    /**
     * Options for assigning fields using `Duration.prototype.with()` or entire
     * objects with `Duration.from()`, and for arithmetic with
     * `Duration.prototype.add()` and `Duration.prototype.subtract()`.
     * */
    export type DurationOptions = {
      /**
       * How to deal with out-of-range values
       *
       * - In `'constrain'` mode, out-of-range values are clamped to the nearest
       *   in-range value.
       * - In `'balance'` mode, out-of-range values are resolved by balancing them
       *   with the next highest unit.
       *
       * The default is `'constrain'`.
       */
      overflow?: 'constrain' | 'balance';
    };

    /**
     * Options for conversions of `Temporal.PlainDateTime` to `Temporal.Instant`
     * */
    export type ToInstantOptions = {
      /**
       * Controls handling of invalid or ambiguous times caused by time zone
       * offset changes like Daylight Saving time (DST) transitions.
       *
       * This option is only relevant if a `DateTime` value does not exist in the
       * destination time zone (e.g. near "Spring Forward" DST transitions), or
       * exists more than once (e.g. near "Fall Back" DST transitions).
       *
       * In case of ambiguous or non-existent times, this option controls what
       * exact time to return:
       * - `'compatible'`: Equivalent to `'earlier'` for backward transitions like
       *   the start of DST in the Spring, and `'later'` for forward transitions
       *   like the end of DST in the Fall. This matches the behavior of legacy
       *   `Date`, of libraries like moment.js, Luxon, or date-fns, and of
       *   cross-platform standards like [RFC 5545
       *   (iCalendar)](https://tools.ietf.org/html/rfc5545).
       * - `'earlier'`: The earlier time of two possible times
       * - `'later'`: The later of two possible times
       * - `'reject'`: Throw a RangeError instead
       *
       * The default is `'compatible'`.
       *
       * */
      disambiguation?: 'compatible' | 'earlier' | 'later' | 'reject';
    };

    type OffsetDisambiguationOptions = {
      /**
       * Time zone definitions can change. If an application stores data about
       * events in the future, then stored data about future events may become
       * ambiguous, for example if a country permanently abolishes DST. The
       * `offset` option controls this unusual case.
       *
       * - `'use'` always uses the offset (if it's provided) to calculate the
       *   instant. This ensures that the result will match the instant that was
       *   originally stored, even if local clock time is different.
       * - `'prefer'` uses the offset if it's valid for the date/time in this time
       *   zone, but if it's not valid then the time zone will be used as a
       *   fallback to calculate the instant.
       * - `'ignore'` will disregard any provided offset. Instead, the time zone
       *    and date/time value are used to calculate the instant. This will keep
       *    local clock time unchanged but may result in a different real-world
       *    instant.
       * - `'reject'` acts like `'prefer'`, except it will throw a RangeError if
       *   the offset is not valid for the given time zone identifier and
       *   date/time value.
       *
       * If the ISO string ends in 'Z' then this option is ignored because there
       * is no possibility of ambiguity.
       *
       * If a time zone offset is not present in the input, then this option is
       * ignored because the time zone will always be used to calculate the
       * offset.
       *
       * If the offset is not used, and if the date/time and time zone don't
       * uniquely identify a single instant, then the `disambiguation` option will
       * be used to choose the correct instant. However, if the offset is used
       * then the `disambiguation` option will be ignored.
       */
      offset?: 'use' | 'prefer' | 'ignore' | 'reject';
    };

    export type ZonedDateTimeAssignmentOptions = Partial<
      AssignmentOptions & ToInstantOptions & OffsetDisambiguationOptions
    >;

    /**
     * Options for arithmetic operations like `add()` and `subtract()`
     * */
    export type ArithmeticOptions = {
      /**
       * Controls handling of out-of-range arithmetic results.
       *
       * If a result is out of range, then `'constrain'` will clamp the result to
       * the allowed range, while `'reject'` will throw a RangeError.
       *
       * The default is `'constrain'`.
       */
      overflow?: 'constrain' | 'reject';
    };

    export type DateUnit = 'year' | 'month' | 'week' | 'day';
    export type TimeUnit = 'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond';
    export type DateTimeUnit = DateUnit | TimeUnit;

    /**
     * When the name of a unit is provided to a Temporal API as a string, it is
     * usually singular, e.g. 'day' or 'hour'. But plural unit names like 'days'
     * or 'hours' are aso accepted too.
     * */
    export type PluralUnit<T extends DateTimeUnit> = {
      year: 'years';
      month: 'months';
      week: 'weeks';
      day: 'days';
      hour: 'hours';
      minute: 'minutes';
      second: 'seconds';
      millisecond: 'milliseconds';
      microsecond: 'microseconds';
      nanosecond: 'nanoseconds';
    }[T];

    export type LargestUnit<T extends DateTimeUnit> = 'auto' | T | PluralUnit<T>;
    export type SmallestUnit<T extends DateTimeUnit> = T | PluralUnit<T>;
    export type TotalUnit<T extends DateTimeUnit> = T | PluralUnit<T>;

    /**
     * Options for outputting precision in toString() on types with seconds
     */
    export type ToStringPrecisionOptions = {
      fractionalSecondDigits?: 'auto' | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
      smallestUnit?: SmallestUnit<'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>;

      /**
       * Controls how rounding is performed:
       * - `halfExpand`: Round to the nearest of the values allowed by
       *   `roundingIncrement` and `smallestUnit`. When there is a tie, round up.
       *   This mode is the default.
       * - `ceil`: Always round up, towards the end of time.
       * - `trunc`: Always round down, towards the beginning of time.
       * - `floor`: Also round down, towards the beginning of time. This mode acts
       *   the same as `trunc`, but it's included for consistency with
       *   `Temporal.Duration.round()` where negative values are allowed and
       *   `trunc` rounds towards zero, unlike `floor` which rounds towards
       *   negative infinity which is usually unexpected. For this reason, `trunc`
       *   is recommended for most use cases.
       */
      roundingMode?: RoundingMode;
    };

    export type ShowCalendarOption = {
      calendarName?: 'auto' | 'always' | 'never';
    };

    export type CalendarTypeToStringOptions = Partial<ToStringPrecisionOptions & ShowCalendarOption>;

    export type ZonedDateTimeToStringOptions = Partial<
      CalendarTypeToStringOptions & {
        timeZoneName?: 'auto' | 'never';
        offset?: 'auto' | 'never';
      }
    >;

    export type InstantToStringOptions = Partial<
      ToStringPrecisionOptions & {
        timeZone: TimeZoneLike;
      }
    >;

    /**
     * Options to control the result of `until()` and `since()` methods in
     * `Temporal` types.
     */
    export interface DifferenceOptions<T extends DateTimeUnit> {
      /**
       * The unit to round to. For example, to round to the nearest minute, use
       * `smallestUnit: 'minute'`. This property is optional for `until()` and
       * `since()`, because those methods default behavior is not to round.
       * However, the same property is required for `round()`.
       */
      smallestUnit?: SmallestUnit<T>;

      /**
       * The largest unit to allow in the resulting `Temporal.Duration` object.
       *
       * Larger units will be "balanced" into smaller units. For example, if
       * `largestUnit` is `'minute'` then a two-hour duration will be output as a
       * 120-minute duration.
       *
       * Valid values may include `'year'`, `'month'`, `'week'`, `'day'`,
       * `'hour'`, `'minute'`, `'second'`, `'millisecond'`, `'microsecond'`,
       * `'nanosecond'` and `'auto'`, although some types may throw an exception
       * if a value is used that would produce an invalid result. For example,
       * `hours` is not accepted by `Temporal.PlainDate.prototype.since()`.
       *
       * The default is always `'auto'`, though the meaning of this depends on the
       * type being used.
       */
      largestUnit?: LargestUnit<T>;

      /**
       * Allows rounding to an integer number of units. For example, to round to
       * increments of a half hour, use `{ smallestUnit: 'minute',
       * roundingIncrement: 30 }`.
       */
      roundingIncrement?: number;

      /**
       * Controls how rounding is performed:
       * - `halfExpand`: Round to the nearest of the values allowed by
       *   `roundingIncrement` and `smallestUnit`. When there is a tie, round away
       *   from zero like `ceil` for positive durations and like `floor` for
       *   negative durations.
       * - `ceil`: Always round up, towards the end of time.
       * - `trunc`: Always round down, towards the beginning of time. This mode is
       *   the default.
       * - `floor`: Also round down, towards the beginning of time. This mode acts
       *   the same as `trunc`, but it's included for consistency with
       *   `Temporal.Duration.round()` where negative values are allowed and
       *   `trunc` rounds towards zero, unlike `floor` which rounds towards
       *   negative infinity which is usually unexpected. For this reason, `trunc`
       *   is recommended for most use cases.
       */
      roundingMode?: RoundingMode;
    }

    /**
     * `round` methods take one required parameter. If a string is provided, the
     * resulting `Temporal.Duration` object will be rounded to that unit. If an
     * object is provided, its `smallestUnit` property is required while other
     * properties are optional. A string is treated the same as an object whose
     * `smallestUnit` property value is that string.
     */
    export type RoundTo<T extends DateTimeUnit> =
      | SmallestUnit<T>
      | {
          /**
           * The unit to round to. For example, to round to the nearest minute,
           * use `smallestUnit: 'minute'`. This option is required. Note that the
           * same-named property is optional when passed to `until` or `since`
           * methods, because those methods do no rounding by default.
           */
          smallestUnit: SmallestUnit<T>;

          /**
           * Allows rounding to an integer number of units. For example, to round to
           * increments of a half hour, use `{ smallestUnit: 'minute',
           * roundingIncrement: 30 }`.
           */
          roundingIncrement?: number;

          /**
           * Controls how rounding is performed:
           * - `halfExpand`: Round to the nearest of the values allowed by
           *   `roundingIncrement` and `smallestUnit`. When there is a tie, round up.
           *   This mode is the default.
           * - `ceil`: Always round up, towards the end of time.
           * - `trunc`: Always round down, towards the beginning of time.
           * - `floor`: Also round down, towards the beginning of time. This mode acts
           *   the same as `trunc`, but it's included for consistency with
           *   `Temporal.Duration.round()` where negative values are allowed and
           *   `trunc` rounds towards zero, unlike `floor` which rounds towards
           *   negative infinity which is usually unexpected. For this reason, `trunc`
           *   is recommended for most use cases.
           */
          roundingMode?: RoundingMode;
        };

    /**
     * The `round` method of the `Temporal.Duration` accepts one required
     * parameter. If a string is provided, the resulting `Temporal.Duration`
     * object will be rounded to that unit. If an object is provided, the
     * `smallestUnit` and/or `largestUnit` property is required, while other
     * properties are optional. A string parameter is treated the same as an
     * object whose `smallestUnit` property value is that string.
     */
    export type DurationRoundTo =
      | SmallestUnit<DateTimeUnit>
      | ((
          | {
              /**
               * The unit to round to. For example, to round to the nearest
               * minute, use `smallestUnit: 'minute'`. This property is normally
               * required, but is optional if `largestUnit` is provided and not
               * undefined.
               */
              smallestUnit: SmallestUnit<DateTimeUnit>;

              /**
               * The largest unit to allow in the resulting `Temporal.Duration`
               * object.
               *
               * Larger units will be "balanced" into smaller units. For example,
               * if `largestUnit` is `'minute'` then a two-hour duration will be
               * output as a 120-minute duration.
               *
               * Valid values include `'year'`, `'month'`, `'week'`, `'day'`,
               * `'hour'`, `'minute'`, `'second'`, `'millisecond'`,
               * `'microsecond'`, `'nanosecond'` and `'auto'`.
               *
               * The default is `'auto'`, which means "the largest nonzero unit in
               * the input duration". This default prevents expanding durations to
               * larger units unless the caller opts into this behavior.
               *
               * If `smallestUnit` is larger, then `smallestUnit` will be used as
               * `largestUnit`, superseding a caller-supplied or default value.
               */
              largestUnit?: LargestUnit<DateTimeUnit>;
            }
          | {
              /**
               * The unit to round to. For example, to round to the nearest
               * minute, use `smallestUnit: 'minute'`. This property is normally
               * required, but is optional if `largestUnit` is provided and not
               * undefined.
               */
              smallestUnit?: SmallestUnit<DateTimeUnit>;

              /**
               * The largest unit to allow in the resulting `Temporal.Duration`
               * object.
               *
               * Larger units will be "balanced" into smaller units. For example,
               * if `largestUnit` is `'minute'` then a two-hour duration will be
               * output as a 120-minute duration.
               *
               * Valid values include `'year'`, `'month'`, `'week'`, `'day'`,
               * `'hour'`, `'minute'`, `'second'`, `'millisecond'`,
               * `'microsecond'`, `'nanosecond'` and `'auto'`.
               *
               * The default is `'auto'`, which means "the largest nonzero unit in
               * the input duration". This default prevents expanding durations to
               * larger units unless the caller opts into this behavior.
               *
               * If `smallestUnit` is larger, then `smallestUnit` will be used as
               * `largestUnit`, superseding a caller-supplied or default value.
               */
              largestUnit: LargestUnit<DateTimeUnit>;
            }
        ) & {
          /**
           * Allows rounding to an integer number of units. For example, to round
           * to increments of a half hour, use `{ smallestUnit: 'minute',
           * roundingIncrement: 30 }`.
           */
          roundingIncrement?: number;

          /**
           * Controls how rounding is performed:
           * - `halfExpand`: Round to the nearest of the values allowed by
           *   `roundingIncrement` and `smallestUnit`. When there is a tie, round
           *   away from zero like `ceil` for positive durations and like `floor`
           *   for negative durations. This mode is the default.
           * - `ceil`: Always round towards positive infinity. For negative
           *   durations this option will decrease the absolute value of the
           *   duration which may be unexpected. To round away from zero, use
           *   `ceil` for positive durations and `floor` for negative durations.
           * - `trunc`: Always round down towards zero.
           * - `floor`: Always round towards negative infinity. This mode acts the
           *   same as `trunc` for positive durations but for negative durations
           *   it will increase the absolute value of the result which may be
           *   unexpected. For this reason, `trunc` is recommended for most "round
           *   down" use cases.
           */
          roundingMode?: RoundingMode;

          /**
           * The starting point to use for rounding and conversions when
           * variable-length units (years, months, weeks depending on the
           * calendar) are involved. This option is required if any of the
           * following are true:
           * - `unit` is `'week'` or larger units
           * - `this` has a nonzero value for `weeks` or larger units
           *
           * This value must be either a `Temporal.PlainDateTime`, a
           * `Temporal.ZonedDateTime`, or a string or object value that can be
           * passed to `from()` of those types. Examples:
           * - `'2020-01'01T00:00-08:00[America/Los_Angeles]'`
           * - `'2020-01'01'`
           * - `Temporal.PlainDate.from('2020-01-01')`
           *
           * `Temporal.ZonedDateTime` will be tried first because it's more
           * specific, with `Temporal.PlainDateTime` as a fallback.
           *
           * If the value resolves to a `Temporal.ZonedDateTime`, then operation
           * will adjust for DST and other time zone transitions. Otherwise
           * (including if this option is omitted), then the operation will ignore
           * time zone transitions and all days will be assumed to be 24 hours
           * long.
           */
          relativeTo?: Temporal.PlainDateTime | Temporal.ZonedDateTime | PlainDateTimeLike | ZonedDateTimeLike | string;
        });

    /**
     * Options to control behavior of `Duration.prototype.total()`
     */
    export type DurationTotalOf =
      | TotalUnit<DateTimeUnit>
      | {
          /**
           * The unit to convert the duration to. This option is required.
           */
          unit: TotalUnit<DateTimeUnit>;

          /**
           * The starting point to use when variable-length units (years, months,
           * weeks depending on the calendar) are involved. This option is required if
           * any of the following are true:
           * - `unit` is `'week'` or larger units
           * - `this` has a nonzero value for `weeks` or larger units
           *
           * This value must be either a `Temporal.PlainDateTime`, a
           * `Temporal.ZonedDateTime`, or a string or object value that can be passed
           * to `from()` of those types. Examples:
           * - `'2020-01'01T00:00-08:00[America/Los_Angeles]'`
           * - `'2020-01'01'`
           * - `Temporal.PlainDate.from('2020-01-01')`
           *
           * `Temporal.ZonedDateTime` will be tried first because it's more
           * specific, with `Temporal.PlainDateTime` as a fallback.
           *
           * If the value resolves to a `Temporal.ZonedDateTime`, then operation will
           * adjust for DST and other time zone transitions. Otherwise (including if
           * this option is omitted), then the operation will ignore time zone
           * transitions and all days will be assumed to be 24 hours long.
           */
          relativeTo?: Temporal.ZonedDateTime | Temporal.PlainDateTime | ZonedDateTimeLike | PlainDateTimeLike | string;
        };

    /**
     * Options to control behavior of `Duration.compare()`, `Duration.add()`, and
     * `Duration.subtract()`
     */
    export interface DurationArithmeticOptions {
      /**
       * The starting point to use when variable-length units (years, months,
       * weeks depending on the calendar) are involved. This option is required if
       * either of the durations has a nonzero value for `weeks` or larger units.
       *
       * This value must be either a `Temporal.PlainDateTime`, a
       * `Temporal.ZonedDateTime`, or a string or object value that can be passed
       * to `from()` of those types. Examples:
       * - `'2020-01'01T00:00-08:00[America/Los_Angeles]'`
       * - `'2020-01'01'`
       * - `Temporal.PlainDate.from('2020-01-01')`
       *
       * `Temporal.ZonedDateTime` will be tried first because it's more
       * specific, with `Temporal.PlainDateTime` as a fallback.
       *
       * If the value resolves to a `Temporal.ZonedDateTime`, then operation will
       * adjust for DST and other time zone transitions. Otherwise (including if
       * this option is omitted), then the operation will ignore time zone
       * transitions and all days will be assumed to be 24 hours long.
       */
      relativeTo?: Temporal.ZonedDateTime | Temporal.PlainDateTime | ZonedDateTimeLike | PlainDateTimeLike | string;
    }

    export type DurationLike = {
      years?: number;
      months?: number;
      weeks?: number;
      days?: number;
      hours?: number;
      minutes?: number;
      seconds?: number;
      milliseconds?: number;
      microseconds?: number;
      nanoseconds?: number;
    };

    /**
     *
     * A `Temporal.Duration` represents an immutable duration of time which can be
     * used in date/time arithmetic.
     *
     * See https://tc39.es/proposal-temporal/docs/duration.html for more details.
     */
    export class Duration {
      static from(item: Temporal.Duration | DurationLike | string): Temporal.Duration;

      static compare(
        one: Temporal.Duration | DurationLike | string,
        two: Temporal.Duration | DurationLike | string,
        options?: DurationArithmeticOptions,
      ): ComparisonResult;

      constructor(
        years?: number,
        months?: number,
        weeks?: number,
        days?: number,
        hours?: number,
        minutes?: number,
        seconds?: number,
        milliseconds?: number,
        microseconds?: number,
        nanoseconds?: number,
      );

      readonly sign: -1 | 0 | 1;
      readonly blank: boolean;
      readonly years: number;
      readonly months: number;
      readonly weeks: number;
      readonly days: number;
      readonly hours: number;
      readonly minutes: number;
      readonly seconds: number;
      readonly milliseconds: number;
      readonly microseconds: number;
      readonly nanoseconds: number;

      negated(): Temporal.Duration;

      abs(): Temporal.Duration;

      with(durationLike: DurationLike): Temporal.Duration;

      add(other: Temporal.Duration | DurationLike | string, options?: DurationArithmeticOptions): Temporal.Duration;

      subtract(
        other: Temporal.Duration | DurationLike | string,
        options?: DurationArithmeticOptions,
      ): Temporal.Duration;

      round(roundTo: DurationRoundTo): Temporal.Duration;

      total(totalOf: DurationTotalOf): number;

      toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;

      toJSON(): string;

      toString(options?: ToStringPrecisionOptions): string;

      valueOf(): never;

      readonly [Symbol.toStringTag]: 'Temporal.Duration';
    }

    /**
     * A `Temporal.Instant` is an exact point in time, with a precision in
     * nanoseconds. No time zone or calendar information is present. Therefore,
     * `Temporal.Instant` has no concept of days, months, or even hours.
     *
     * For convenience of interoperability, it internally uses nanoseconds since
     * the {@link https://en.wikipedia.org/wiki/Unix_time|Unix epoch} (midnight
     * UTC on January 1, 1970). However, a `Temporal.Instant` can be created from
     * any of several expressions that refer to a single point in time, including
     * an {@link https://en.wikipedia.org/wiki/ISO_8601|ISO 8601 string} with a
     * time zone offset such as '2020-01-23T17:04:36.491865121-08:00'.
     *
     * See https://tc39.es/proposal-temporal/docs/instant.html for more details.
     */
    export class Instant {
      static fromEpochSeconds(epochSeconds: number): Temporal.Instant;

      static fromEpochMilliseconds(epochMilliseconds: number): Temporal.Instant;

      static fromEpochMicroseconds(epochMicroseconds: bigint): Temporal.Instant;

      static fromEpochNanoseconds(epochNanoseconds: bigint): Temporal.Instant;

      static from(item: Temporal.Instant | string): Temporal.Instant;

      static compare(one: Temporal.Instant | string, two: Temporal.Instant | string): ComparisonResult;

      constructor(epochNanoseconds: bigint);

      readonly epochSeconds: number;
      readonly epochMilliseconds: number;
      readonly epochMicroseconds: bigint;
      readonly epochNanoseconds: bigint;

      equals(other: Temporal.Instant | string): boolean;

      add(
        durationLike: Omit<Temporal.Duration | DurationLike, 'years' | 'months' | 'weeks' | 'days'> | string,
      ): Temporal.Instant;

      subtract(
        durationLike: Omit<Temporal.Duration | DurationLike, 'years' | 'months' | 'weeks' | 'days'> | string,
      ): Temporal.Instant;

      until(
        other: Temporal.Instant | string,
        options?: DifferenceOptions<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>,
      ): Temporal.Duration;

      since(
        other: Temporal.Instant | string,
        options?: DifferenceOptions<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>,
      ): Temporal.Duration;

      round(
        roundTo: RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>,
      ): Temporal.Instant;

      toZonedDateTime(calendarAndTimeZone: { timeZone: TimeZoneLike; calendar: CalendarLike }): Temporal.ZonedDateTime;

      toZonedDateTimeISO(tzLike: TimeZoneLike): Temporal.ZonedDateTime;

      toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;

      toJSON(): string;

      toString(options?: InstantToStringOptions): string;

      valueOf(): never;

      readonly [Symbol.toStringTag]: 'Temporal.Instant';
    }

    type YearOrEraAndEraYear = { era: string; eraYear: number } | { year: number };
    type MonthCodeOrMonthAndYear = (YearOrEraAndEraYear & { month: number }) | { monthCode: string };
    type MonthOrMonthCode = { month: number } | { monthCode: string };

    export interface CalendarProtocol {
      id?: string;
      calendar?: never;

      year(
        date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainYearMonth | PlainDateLike | string,
      ): number;

      month(
        date:
          | Temporal.PlainDate
          | Temporal.PlainDateTime
          | Temporal.PlainYearMonth
          | Temporal.PlainMonthDay
          | PlainDateLike
          | string,
      ): number;

      monthCode(
        date:
          | Temporal.PlainDate
          | Temporal.PlainDateTime
          | Temporal.PlainYearMonth
          | Temporal.PlainMonthDay
          | PlainDateLike
          | string,
      ): string;

      day(date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainMonthDay | PlainDateLike | string): number;

      era(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): string | undefined;

      eraYear(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number | undefined;

      dayOfWeek(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number;

      dayOfYear(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number;

      weekOfYear(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number;

      daysInWeek(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number;

      daysInMonth(
        date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainYearMonth | PlainDateLike | string,
      ): number;

      daysInYear(
        date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainYearMonth | PlainDateLike | string,
      ): number;

      monthsInYear(
        date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainYearMonth | PlainDateLike | string,
      ): number;

      inLeapYear(
        date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainYearMonth | PlainDateLike | string,
      ): boolean;

      dateFromFields(
        fields: YearOrEraAndEraYear & MonthOrMonthCode & { day: number },
        options?: AssignmentOptions,
      ): Temporal.PlainDate;

      yearMonthFromFields(
        fields: YearOrEraAndEraYear & MonthOrMonthCode,
        options?: AssignmentOptions,
      ): Temporal.PlainYearMonth;

      monthDayFromFields(
        fields: MonthCodeOrMonthAndYear & { day: number },
        options?: AssignmentOptions,
      ): Temporal.PlainMonthDay;

      dateAdd(
        date: Temporal.PlainDate | PlainDateLike | string,
        duration: Temporal.Duration | DurationLike | string,
        options?: ArithmeticOptions,
      ): Temporal.PlainDate;

      dateUntil(
        one: Temporal.PlainDate | PlainDateLike | string,
        two: Temporal.PlainDate | PlainDateLike | string,
        options?: DifferenceOptions<'year' | 'month' | 'week' | 'day'>,
      ): Temporal.Duration;

      fields?(fields: Iterable<string>): Iterable<string>;

      mergeFields?(fields: Record<string, unknown>, additionalFields: Record<string, unknown>): Record<string, unknown>;

      toString(): string;

      toJSON?(): string;
    }

    export type CalendarLike = CalendarProtocol | string | { calendar: CalendarProtocol | string };

    /**
     * A `Temporal.Calendar` is a representation of a calendar system. It includes
     * information about how many days are in each year, how many months are in
     * each year, how many days are in each month, and how to do arithmetic in
     * that calendar system.
     *
     * See https://tc39.es/proposal-temporal/docs/calendar.html for more details.
     */
    export class Calendar implements Omit<Required<CalendarProtocol>, 'calendar'> {
      static from(item: CalendarLike): Temporal.Calendar | CalendarProtocol;

      constructor(calendarIdentifier: string);

      readonly id: string;

      year(
        date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainYearMonth | PlainDateLike | string,
      ): number;

      month(
        date:
          | Temporal.PlainDate
          | Temporal.PlainDateTime
          | Temporal.PlainYearMonth
          | Temporal.PlainMonthDay
          | PlainDateLike
          | string,
      ): number;

      monthCode(
        date:
          | Temporal.PlainDate
          | Temporal.PlainDateTime
          | Temporal.PlainYearMonth
          | Temporal.PlainMonthDay
          | PlainDateLike
          | string,
      ): string;

      day(date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainMonthDay | PlainDateLike | string): number;

      era(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): string | undefined;

      eraYear(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number | undefined;

      dayOfWeek(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number;

      dayOfYear(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number;

      weekOfYear(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number;

      daysInWeek(date: Temporal.PlainDate | Temporal.PlainDateTime | PlainDateLike | string): number;

      daysInMonth(
        date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainYearMonth | PlainDateLike | string,
      ): number;

      daysInYear(
        date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainYearMonth | PlainDateLike | string,
      ): number;

      monthsInYear(
        date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainYearMonth | PlainDateLike | string,
      ): number;

      inLeapYear(
        date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainYearMonth | PlainDateLike | string,
      ): boolean;

      dateFromFields(
        fields: YearOrEraAndEraYear & MonthOrMonthCode & { day: number },
        options?: AssignmentOptions,
      ): Temporal.PlainDate;

      yearMonthFromFields(
        fields: YearOrEraAndEraYear & MonthOrMonthCode,
        options?: AssignmentOptions,
      ): Temporal.PlainYearMonth;

      monthDayFromFields(
        fields: MonthCodeOrMonthAndYear & { day: number },
        options?: AssignmentOptions,
      ): Temporal.PlainMonthDay;

      dateAdd(
        date: Temporal.PlainDate | PlainDateLike | string,
        duration: Temporal.Duration | DurationLike | string,
        options?: ArithmeticOptions,
      ): Temporal.PlainDate;

      dateUntil(
        one: Temporal.PlainDate | PlainDateLike | string,
        two: Temporal.PlainDate | PlainDateLike | string,
        options?: DifferenceOptions<'year' | 'month' | 'week' | 'day'>,
      ): Temporal.Duration;

      fields(fields: Iterable<string>): string[];

      mergeFields(fields: Record<string, unknown>, additionalFields: Record<string, unknown>): Record<string, unknown>;

      toString(): string;

      toJSON(): string;

      readonly [Symbol.toStringTag]: 'Temporal.Calendar';
    }

    export type PlainDateLike = {
      era?: string | undefined;
      eraYear?: number | undefined;
      year?: number;
      month?: number;
      monthCode?: string;
      day?: number;
      calendar?: CalendarLike;
    };

    type PlainDateISOFields = {
      isoYear: number;
      isoMonth: number;
      isoDay: number;
      calendar: CalendarProtocol;
    };

    /**
     * A `Temporal.PlainDate` represents a calendar date. "Calendar date" refers to the
     * concept of a date as expressed in everyday usage, independent of any time
     * zone. For example, it could be used to represent an event on a calendar
     * which happens during the whole day no matter which time zone it's happening
     * in.
     *
     * See https://tc39.es/proposal-temporal/docs/date.html for more details.
     */
    export class PlainDate {
      static from(item: Temporal.PlainDate | PlainDateLike | string, options?: AssignmentOptions): Temporal.PlainDate;

      static compare(
        one: Temporal.PlainDate | PlainDateLike | string,
        two: Temporal.PlainDate | PlainDateLike | string,
      ): ComparisonResult;

      constructor(isoYear: number, isoMonth: number, isoDay: number, calendar?: CalendarLike);

      readonly era: string | undefined;
      readonly eraYear: number | undefined;
      readonly year: number;
      readonly month: number;
      readonly monthCode: string;
      readonly day: number;
      readonly calendar: CalendarProtocol;
      readonly dayOfWeek: number;
      readonly dayOfYear: number;
      readonly weekOfYear: number;
      readonly daysInWeek: number;
      readonly daysInYear: number;
      readonly daysInMonth: number;
      readonly monthsInYear: number;
      readonly inLeapYear: boolean;

      equals(other: Temporal.PlainDate | PlainDateLike | string): boolean;

      with(dateLike: PlainDateLike, options?: AssignmentOptions): Temporal.PlainDate;

      withCalendar(calendar: CalendarLike): Temporal.PlainDate;

      add(durationLike: Temporal.Duration | DurationLike | string, options?: ArithmeticOptions): Temporal.PlainDate;

      subtract(
        durationLike: Temporal.Duration | DurationLike | string,
        options?: ArithmeticOptions,
      ): Temporal.PlainDate;

      until(
        other: Temporal.PlainDate | PlainDateLike | string,
        options?: DifferenceOptions<'year' | 'month' | 'week' | 'day'>,
      ): Temporal.Duration;

      since(
        other: Temporal.PlainDate | PlainDateLike | string,
        options?: DifferenceOptions<'year' | 'month' | 'week' | 'day'>,
      ): Temporal.Duration;

      toPlainDateTime(temporalTime?: Temporal.PlainTime | PlainTimeLike | string): Temporal.PlainDateTime;

      toZonedDateTime(
        timeZoneAndTime:
          | TimeZoneProtocol
          | string
          | {
              timeZone: TimeZoneLike;
              plainTime?: Temporal.PlainTime | PlainTimeLike | string;
            },
      ): Temporal.ZonedDateTime;

      toPlainYearMonth(): Temporal.PlainYearMonth;

      toPlainMonthDay(): Temporal.PlainMonthDay;

      getISOFields(): PlainDateISOFields;

      toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;

      toJSON(): string;

      toString(options?: ShowCalendarOption): string;

      valueOf(): never;

      readonly [Symbol.toStringTag]: 'Temporal.PlainDate';
    }

    export type PlainDateTimeLike = {
      era?: string | undefined;
      eraYear?: number | undefined;
      year?: number;
      month?: number;
      monthCode?: string;
      day?: number;
      hour?: number;
      minute?: number;
      second?: number;
      millisecond?: number;
      microsecond?: number;
      nanosecond?: number;
      calendar?: CalendarLike;
    };

    type PlainDateTimeISOFields = {
      isoYear: number;
      isoMonth: number;
      isoDay: number;
      isoHour: number;
      isoMinute: number;
      isoSecond: number;
      isoMillisecond: number;
      isoMicrosecond: number;
      isoNanosecond: number;
      calendar: CalendarProtocol;
    };

    /**
     * A `Temporal.PlainDateTime` represents a calendar date and wall-clock time, with
     * a precision in nanoseconds, and without any time zone. Of the Temporal
     * classes carrying human-readable time information, it is the most general
     * and complete one. `Temporal.PlainDate`, `Temporal.PlainTime`, `Temporal.PlainYearMonth`,
     * and `Temporal.PlainMonthDay` all carry less information and should be used when
     * complete information is not required.
     *
     * See https://tc39.es/proposal-temporal/docs/datetime.html for more details.
     */
    export class PlainDateTime {
      static from(
        item: Temporal.PlainDateTime | PlainDateTimeLike | string,
        options?: AssignmentOptions,
      ): Temporal.PlainDateTime;

      static compare(
        one: Temporal.PlainDateTime | PlainDateTimeLike | string,
        two: Temporal.PlainDateTime | PlainDateTimeLike | string,
      ): ComparisonResult;

      constructor(
        isoYear: number,
        isoMonth: number,
        isoDay: number,
        hour?: number,
        minute?: number,
        second?: number,
        millisecond?: number,
        microsecond?: number,
        nanosecond?: number,
        calendar?: CalendarLike,
      );

      readonly era: string | undefined;
      readonly eraYear: number | undefined;
      readonly year: number;
      readonly month: number;
      readonly monthCode: string;
      readonly day: number;
      readonly hour: number;
      readonly minute: number;
      readonly second: number;
      readonly millisecond: number;
      readonly microsecond: number;
      readonly nanosecond: number;
      readonly calendar: CalendarProtocol;
      readonly dayOfWeek: number;
      readonly dayOfYear: number;
      readonly weekOfYear: number;
      readonly daysInWeek: number;
      readonly daysInYear: number;
      readonly daysInMonth: number;
      readonly monthsInYear: number;
      readonly inLeapYear: boolean;

      equals(other: Temporal.PlainDateTime | PlainDateTimeLike | string): boolean;

      with(dateTimeLike: PlainDateTimeLike, options?: AssignmentOptions): Temporal.PlainDateTime;

      withPlainTime(timeLike?: Temporal.PlainTime | PlainTimeLike | string): Temporal.PlainDateTime;

      withPlainDate(dateLike: Temporal.PlainDate | PlainDateLike | string): Temporal.PlainDateTime;

      withCalendar(calendar: CalendarLike): Temporal.PlainDateTime;

      add(durationLike: Temporal.Duration | DurationLike | string, options?: ArithmeticOptions): Temporal.PlainDateTime;

      subtract(
        durationLike: Temporal.Duration | DurationLike | string,
        options?: ArithmeticOptions,
      ): Temporal.PlainDateTime;

      until(
        other: Temporal.PlainDateTime | PlainDateTimeLike | string,
        options?: DifferenceOptions<
          | 'year'
          | 'month'
          | 'week'
          | 'day'
          | 'hour'
          | 'minute'
          | 'second'
          | 'millisecond'
          | 'microsecond'
          | 'nanosecond'
        >,
      ): Temporal.Duration;

      since(
        other: Temporal.PlainDateTime | PlainDateTimeLike | string,
        options?: DifferenceOptions<
          | 'year'
          | 'month'
          | 'week'
          | 'day'
          | 'hour'
          | 'minute'
          | 'second'
          | 'millisecond'
          | 'microsecond'
          | 'nanosecond'
        >,
      ): Temporal.Duration;

      round(
        roundTo: RoundTo<'day' | 'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>,
      ): Temporal.PlainDateTime;

      toZonedDateTime(tzLike: TimeZoneLike, options?: ToInstantOptions): Temporal.ZonedDateTime;

      toPlainDate(): Temporal.PlainDate;

      toPlainYearMonth(): Temporal.PlainYearMonth;

      toPlainMonthDay(): Temporal.PlainMonthDay;

      toPlainTime(): Temporal.PlainTime;

      getISOFields(): PlainDateTimeISOFields;

      toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;

      toJSON(): string;

      toString(options?: CalendarTypeToStringOptions): string;

      valueOf(): never;

      readonly [Symbol.toStringTag]: 'Temporal.PlainDateTime';
    }

    export type PlainMonthDayLike = {
      era?: string | undefined;
      eraYear?: number | undefined;
      year?: number;
      month?: number;
      monthCode?: string;
      day?: number;
      calendar?: CalendarLike;
    };

    /**
     * A `Temporal.PlainMonthDay` represents a particular day on the calendar, but
     * without a year. For example, it could be used to represent a yearly
     * recurring event, like "Bastille Day is on the 14th of July."
     *
     * See https://tc39.es/proposal-temporal/docs/monthday.html for more details.
     */
    export class PlainMonthDay {
      static from(
        item: Temporal.PlainMonthDay | PlainMonthDayLike | string,
        options?: AssignmentOptions,
      ): Temporal.PlainMonthDay;

      constructor(isoMonth: number, isoDay: number, calendar?: CalendarLike, referenceISOYear?: number);

      readonly monthCode: string;
      readonly day: number;
      readonly calendar: CalendarProtocol;

      equals(other: Temporal.PlainMonthDay | PlainMonthDayLike | string): boolean;

      with(monthDayLike: PlainMonthDayLike, options?: AssignmentOptions): Temporal.PlainMonthDay;

      toPlainDate(year: { year: number }): Temporal.PlainDate;

      getISOFields(): PlainDateISOFields;

      toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;

      toJSON(): string;

      toString(options?: ShowCalendarOption): string;

      valueOf(): never;

      readonly [Symbol.toStringTag]: 'Temporal.PlainMonthDay';
    }

    // Temporal.PlainTime's `calendar` field is a Temporal.Calendar, not a
    // Temporal.CalendarProtocol, because that type's calendar is not customizable
    // by users. Temporal.ZonedDateTime and Temporal.PlainDateTime are also
    // "time-like" but their `calendar` is a Temporal.CalendarProtocol. Therefore,
    // those types are added below to ensure that their instances are accepted by
    // methods that take a PlainTimeLike object.
    export type PlainTimeLike =
      | {
          hour?: number;
          minute?: number;
          second?: number;
          millisecond?: number;
          microsecond?: number;
          nanosecond?: number;
          calendar?: Temporal.Calendar | 'iso8601';
        }
      | Temporal.ZonedDateTime
      | Temporal.PlainDateTime;

    type PlainTimeISOFields = {
      isoHour: number;
      isoMinute: number;
      isoSecond: number;
      isoMillisecond: number;
      isoMicrosecond: number;
      isoNanosecond: number;
      calendar: Temporal.Calendar;
    };

    /**
     * A `Temporal.PlainTime` represents a wall-clock time, with a precision in
     * nanoseconds, and without any time zone. "Wall-clock time" refers to the
     * concept of a time as expressed in everyday usage — the time that you read
     * off the clock on the wall. For example, it could be used to represent an
     * event that happens daily at a certain time, no matter what time zone.
     *
     * `Temporal.PlainTime` refers to a time with no associated calendar date; if you
     * need to refer to a specific time on a specific day, use
     * `Temporal.PlainDateTime`. A `Temporal.PlainTime` can be converted into a
     * `Temporal.PlainDateTime` by combining it with a `Temporal.PlainDate` using the
     * `toPlainDateTime()` method.
     *
     * See https://tc39.es/proposal-temporal/docs/time.html for more details.
     */
    export class PlainTime {
      static from(item: Temporal.PlainTime | PlainTimeLike | string, options?: AssignmentOptions): Temporal.PlainTime;

      static compare(
        one: Temporal.PlainTime | PlainTimeLike | string,
        two: Temporal.PlainTime | PlainTimeLike | string,
      ): ComparisonResult;

      constructor(
        hour?: number,
        minute?: number,
        second?: number,
        millisecond?: number,
        microsecond?: number,
        nanosecond?: number,
      );

      readonly hour: number;
      readonly minute: number;
      readonly second: number;
      readonly millisecond: number;
      readonly microsecond: number;
      readonly nanosecond: number;
      readonly calendar: Temporal.Calendar;

      equals(other: Temporal.PlainTime | PlainTimeLike | string): boolean;

      with(timeLike: Temporal.PlainTime | PlainTimeLike, options?: AssignmentOptions): Temporal.PlainTime;

      add(durationLike: Temporal.Duration | DurationLike | string, options?: ArithmeticOptions): Temporal.PlainTime;

      subtract(
        durationLike: Temporal.Duration | DurationLike | string,
        options?: ArithmeticOptions,
      ): Temporal.PlainTime;

      until(
        other: Temporal.PlainTime | PlainTimeLike | string,
        options?: DifferenceOptions<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>,
      ): Temporal.Duration;

      since(
        other: Temporal.PlainTime | PlainTimeLike | string,
        options?: DifferenceOptions<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>,
      ): Temporal.Duration;

      round(
        roundTo: RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>,
      ): Temporal.PlainTime;

      toPlainDateTime(temporalDate: Temporal.PlainDate | PlainDateLike | string): Temporal.PlainDateTime;

      toZonedDateTime(timeZoneAndDate: {
        timeZone: TimeZoneLike;
        plainDate: Temporal.PlainDate | PlainDateLike | string;
      }): Temporal.ZonedDateTime;

      getISOFields(): PlainTimeISOFields;

      toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;

      toJSON(): string;

      toString(options?: ToStringPrecisionOptions): string;

      valueOf(): never;

      readonly [Symbol.toStringTag]: 'Temporal.PlainTime';
    }

    /**
     * A plain object implementing the protocol for a custom time zone.
     */
    export interface TimeZoneProtocol {
      id?: string;
      timeZone?: never;

      getOffsetNanosecondsFor(instant: Temporal.Instant | string): number;

      getOffsetStringFor?(instant: Temporal.Instant | string): string;

      getPlainDateTimeFor?(instant: Temporal.Instant | string, calendar?: CalendarLike): Temporal.PlainDateTime;

      getInstantFor?(
        dateTime: Temporal.PlainDateTime | PlainDateTimeLike | string,
        options?: ToInstantOptions,
      ): Temporal.Instant;

      getNextTransition?(startingPoint: Temporal.Instant | string): Temporal.Instant | null;

      getPreviousTransition?(startingPoint: Temporal.Instant | string): Temporal.Instant | null;

      getPossibleInstantsFor(dateTime: Temporal.PlainDateTime | PlainDateTimeLike | string): Temporal.Instant[];

      toString(): string;

      toJSON?(): string;
    }

    export type TimeZoneLike = TimeZoneProtocol | string | { timeZone: TimeZoneProtocol | string };

    /**
     * A `Temporal.TimeZone` is a representation of a time zone: either an
     * {@link https://www.iana.org/time-zones|IANA time zone}, including
     * information about the time zone such as the offset between the local time
     * and UTC at a particular time, and daylight saving time (DST) changes; or
     * simply a particular UTC offset with no DST.
     *
     * Since `Temporal.Instant` and `Temporal.PlainDateTime` do not contain any time
     * zone information, a `Temporal.TimeZone` object is required to convert
     * between the two.
     *
     * See https://tc39.es/proposal-temporal/docs/timezone.html for more details.
     */
    export class TimeZone implements Omit<Required<TimeZoneProtocol>, 'timeZone'> {
      static from(timeZone: TimeZoneLike): Temporal.TimeZone | TimeZoneProtocol;

      constructor(timeZoneIdentifier: string);

      readonly id: string;

      getOffsetNanosecondsFor(instant: Temporal.Instant | string): number;

      getOffsetStringFor(instant: Temporal.Instant | string): string;

      getPlainDateTimeFor(instant: Temporal.Instant | string, calendar?: CalendarLike): Temporal.PlainDateTime;

      getInstantFor(
        dateTime: Temporal.PlainDateTime | PlainDateTimeLike | string,
        options?: ToInstantOptions,
      ): Temporal.Instant;

      getNextTransition(startingPoint: Temporal.Instant | string): Temporal.Instant | null;

      getPreviousTransition(startingPoint: Temporal.Instant | string): Temporal.Instant | null;

      getPossibleInstantsFor(dateTime: Temporal.PlainDateTime | PlainDateTimeLike | string): Temporal.Instant[];

      toString(): string;

      toJSON(): string;

      readonly [Symbol.toStringTag]: 'Temporal.TimeZone';
    }

    export type PlainYearMonthLike = {
      era?: string | undefined;
      eraYear?: number | undefined;
      year?: number;
      month?: number;
      monthCode?: string;
      calendar?: CalendarLike;
    };

    /**
     * A `Temporal.PlainYearMonth` represents a particular month on the calendar. For
     * example, it could be used to represent a particular instance of a monthly
     * recurring event, like "the June 2019 meeting".
     *
     * See https://tc39.es/proposal-temporal/docs/yearmonth.html for more details.
     */
    export class PlainYearMonth {
      static from(
        item: Temporal.PlainYearMonth | PlainYearMonthLike | string,
        options?: AssignmentOptions,
      ): Temporal.PlainYearMonth;

      static compare(
        one: Temporal.PlainYearMonth | PlainYearMonthLike | string,
        two: Temporal.PlainYearMonth | PlainYearMonthLike | string,
      ): ComparisonResult;

      constructor(isoYear: number, isoMonth: number, calendar?: CalendarLike, referenceISODay?: number);

      readonly era: string | undefined;
      readonly eraYear: number | undefined;
      readonly year: number;
      readonly month: number;
      readonly monthCode: string;
      readonly calendar: CalendarProtocol;
      readonly daysInMonth: number;
      readonly daysInYear: number;
      readonly monthsInYear: number;
      readonly inLeapYear: boolean;

      equals(other: Temporal.PlainYearMonth | PlainYearMonthLike | string): boolean;

      with(yearMonthLike: PlainYearMonthLike, options?: AssignmentOptions): Temporal.PlainYearMonth;

      add(
        durationLike: Temporal.Duration | DurationLike | string,
        options?: ArithmeticOptions,
      ): Temporal.PlainYearMonth;

      subtract(
        durationLike: Temporal.Duration | DurationLike | string,
        options?: ArithmeticOptions,
      ): Temporal.PlainYearMonth;

      until(
        other: Temporal.PlainYearMonth | PlainYearMonthLike | string,
        options?: DifferenceOptions<'year' | 'month'>,
      ): Temporal.Duration;

      since(
        other: Temporal.PlainYearMonth | PlainYearMonthLike | string,
        options?: DifferenceOptions<'year' | 'month'>,
      ): Temporal.Duration;

      toPlainDate(day: { day: number }): Temporal.PlainDate;

      getISOFields(): PlainDateISOFields;

      toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;

      toJSON(): string;

      toString(options?: ShowCalendarOption): string;

      valueOf(): never;

      readonly [Symbol.toStringTag]: 'Temporal.PlainYearMonth';
    }

    export type ZonedDateTimeLike = {
      era?: string | undefined;
      eraYear?: number | undefined;
      year?: number;
      month?: number;
      monthCode?: string;
      day?: number;
      hour?: number;
      minute?: number;
      second?: number;
      millisecond?: number;
      microsecond?: number;
      nanosecond?: number;
      offset?: string;
      timeZone?: TimeZoneLike;
      calendar?: CalendarLike;
    };

    type ZonedDateTimeISOFields = {
      isoYear: number;
      isoMonth: number;
      isoDay: number;
      isoHour: number;
      isoMinute: number;
      isoSecond: number;
      isoMillisecond: number;
      isoMicrosecond: number;
      isoNanosecond: number;
      offset: string;
      timeZone: TimeZoneProtocol;
      calendar: CalendarProtocol;
    };

    export class ZonedDateTime {
      static from(
        item: Temporal.ZonedDateTime | ZonedDateTimeLike | string,
        options?: ZonedDateTimeAssignmentOptions,
      ): ZonedDateTime;

      static compare(
        one: Temporal.ZonedDateTime | ZonedDateTimeLike | string,
        two: Temporal.ZonedDateTime | ZonedDateTimeLike | string,
      ): ComparisonResult;

      constructor(epochNanoseconds: bigint, timeZone: TimeZoneLike, calendar?: CalendarLike);

      readonly era: string | undefined;
      readonly eraYear: number | undefined;
      readonly year: number;
      readonly month: number;
      readonly monthCode: string;
      readonly day: number;
      readonly hour: number;
      readonly minute: number;
      readonly second: number;
      readonly millisecond: number;
      readonly microsecond: number;
      readonly nanosecond: number;
      readonly timeZone: TimeZoneProtocol;
      readonly calendar: CalendarProtocol;
      readonly dayOfWeek: number;
      readonly dayOfYear: number;
      readonly weekOfYear: number;
      readonly hoursInDay: number;
      readonly daysInWeek: number;
      readonly daysInMonth: number;
      readonly daysInYear: number;
      readonly monthsInYear: number;
      readonly inLeapYear: boolean;
      readonly offsetNanoseconds: number;
      readonly offset: string;
      readonly epochSeconds: number;
      readonly epochMilliseconds: number;
      readonly epochMicroseconds: bigint;
      readonly epochNanoseconds: bigint;

      equals(other: Temporal.ZonedDateTime | ZonedDateTimeLike | string): boolean;

      with(zonedDateTimeLike: ZonedDateTimeLike, options?: ZonedDateTimeAssignmentOptions): Temporal.ZonedDateTime;

      withPlainTime(timeLike?: Temporal.PlainTime | PlainTimeLike | string): Temporal.ZonedDateTime;

      withPlainDate(dateLike: Temporal.PlainDate | PlainDateLike | string): Temporal.ZonedDateTime;

      withCalendar(calendar: CalendarLike): Temporal.ZonedDateTime;

      withTimeZone(timeZone: TimeZoneLike): Temporal.ZonedDateTime;

      add(durationLike: Temporal.Duration | DurationLike | string, options?: ArithmeticOptions): Temporal.ZonedDateTime;

      subtract(
        durationLike: Temporal.Duration | DurationLike | string,
        options?: ArithmeticOptions,
      ): Temporal.ZonedDateTime;

      until(
        other: Temporal.ZonedDateTime | ZonedDateTimeLike | string,
        options?: Temporal.DifferenceOptions<
          | 'year'
          | 'month'
          | 'week'
          | 'day'
          | 'hour'
          | 'minute'
          | 'second'
          | 'millisecond'
          | 'microsecond'
          | 'nanosecond'
        >,
      ): Temporal.Duration;

      since(
        other: Temporal.ZonedDateTime | ZonedDateTimeLike | string,
        options?: Temporal.DifferenceOptions<
          | 'year'
          | 'month'
          | 'week'
          | 'day'
          | 'hour'
          | 'minute'
          | 'second'
          | 'millisecond'
          | 'microsecond'
          | 'nanosecond'
        >,
      ): Temporal.Duration;

      round(
        roundTo: RoundTo<'day' | 'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>,
      ): Temporal.ZonedDateTime;

      startOfDay(): Temporal.ZonedDateTime;

      toInstant(): Temporal.Instant;

      toPlainDateTime(): Temporal.PlainDateTime;

      toPlainDate(): Temporal.PlainDate;

      toPlainYearMonth(): Temporal.PlainYearMonth;

      toPlainMonthDay(): Temporal.PlainMonthDay;

      toPlainTime(): Temporal.PlainTime;

      getISOFields(): ZonedDateTimeISOFields;

      toLocaleString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;

      toJSON(): string;

      toString(options?: ZonedDateTimeToStringOptions): string;

      valueOf(): never;

      readonly [Symbol.toStringTag]: 'Temporal.ZonedDateTime';
    }

    /**
     * The `Temporal.Now` object has several methods which give information about
     * the current date, time, and time zone.
     *
     * See https://tc39.es/proposal-temporal/docs/now.html for more details.
     */
    export const Now: {
      /**
       * Get the exact system date and time as a `Temporal.Instant`.
       *
       * This method gets the current exact system time, without regard to
       * calendar or time zone. This is a good way to get a timestamp for an
       * event, for example. It works like the old-style JavaScript `Date.now()`,
       * but with nanosecond precision instead of milliseconds.
       *
       * Note that a `Temporal.Instant` doesn't know about time zones. For the
       * exact time in a specific time zone, use `Temporal.Now.zonedDateTimeISO`
       * or `Temporal.Now.zonedDateTime`.
       * */
      instant: () => Temporal.Instant;

      /**
       * Get the current calendar date and clock time in a specific calendar and
       * time zone.
       *
       * The `calendar` parameter is required. When using the ISO 8601 calendar or
       * if you don't understand the need for or implications of a calendar, then
       * a more ergonomic alternative to this method is
       * `Temporal.Now.zonedDateTimeISO()`.
       *
       * @param {CalendarLike} [calendar] - calendar identifier, or
       * a `Temporal.Calendar` instance, or an object implementing the calendar
       * protocol.
       * @param {TimeZoneLike} [tzLike] -
       * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
       * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
       * object implementing the time zone protocol. If omitted, the environment's
       * current time zone will be used.
       */
      zonedDateTime: (calendar: CalendarLike, tzLike?: TimeZoneLike) => Temporal.ZonedDateTime;

      /**
       * Get the current calendar date and clock time in a specific time zone,
       * using the ISO 8601 calendar.
       *
       * @param {TimeZoneLike} [tzLike] -
       * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
       * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
       * object implementing the time zone protocol. If omitted, the environment's
       * current time zone will be used.
       */
      zonedDateTimeISO: (tzLike?: TimeZoneLike) => Temporal.ZonedDateTime;

      /**
       * Get the current calendar date and clock time in a specific calendar and
       * time zone.
       *
       * The calendar is required. When using the ISO 8601 calendar or if you
       * don't understand the need for or implications of a calendar, then a more
       * ergonomic alternative to this method is `Temporal.Now.plainDateTimeISO`.
       *
       * Note that the `Temporal.PlainDateTime` type does not persist the time zone,
       * but retaining the time zone is required for most time-zone-related use
       * cases. Therefore, it's usually recommended to use
       * `Temporal.Now.zonedDateTimeISO` or `Temporal.Now.zonedDateTime` instead
       * of this function.
       *
       * @param {CalendarLike} [calendar] - calendar identifier, or
       * a `Temporal.Calendar` instance, or an object implementing the calendar
       * protocol.
       * @param {TimeZoneLike} [tzLike] -
       * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
       * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
       * object implementing the time zone protocol. If omitted,
       * the environment's current time zone will be used.
       */
      plainDateTime: (calendar: CalendarLike, tzLike?: TimeZoneLike) => Temporal.PlainDateTime;

      /**
       * Get the current date and clock time in a specific time zone, using the
       * ISO 8601 calendar.
       *
       * Note that the `Temporal.PlainDateTime` type does not persist the time zone,
       * but retaining the time zone is required for most time-zone-related use
       * cases. Therefore, it's usually recommended to use
       * `Temporal.Now.zonedDateTimeISO` instead of this function.
       *
       * @param {TimeZoneLike} [tzLike] -
       * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
       * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
       * object implementing the time zone protocol. If omitted, the environment's
       * current time zone will be used.
       */
      plainDateTimeISO: (tzLike?: TimeZoneLike) => Temporal.PlainDateTime;

      /**
       * Get the current calendar date in a specific calendar and time zone.
       *
       * The calendar is required. When using the ISO 8601 calendar or if you
       * don't understand the need for or implications of a calendar, then a more
       * ergonomic alternative to this method is `Temporal.Now.plainDateISO`.
       *
       * @param {CalendarLike} [calendar] - calendar identifier, or
       * a `Temporal.Calendar` instance, or an object implementing the calendar
       * protocol.
       * @param {TimeZoneLike} [tzLike] -
       * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
       * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
       * object implementing the time zone protocol. If omitted,
       * the environment's current time zone will be used.
       */
      plainDate: (calendar: CalendarLike, tzLike?: TimeZoneLike) => Temporal.PlainDate;

      /**
       * Get the current date in a specific time zone, using the ISO 8601
       * calendar.
       *
       * @param {TimeZoneLike} [tzLike] -
       * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
       * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
       * object implementing the time zone protocol. If omitted, the environment's
       * current time zone will be used.
       */
      plainDateISO: (tzLike?: TimeZoneLike) => Temporal.PlainDate;

      /**
       * Get the current clock time in a specific time zone, using the ISO 8601 calendar.
       *
       * @param {TimeZoneLike} [tzLike] -
       * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone identifier}
       * string (e.g. `'Europe/London'`), `Temporal.TimeZone` instance, or an
       * object implementing the time zone protocol. If omitted, the environment's
       * current time zone will be used.
       */
      plainTimeISO: (tzLike?: TimeZoneLike) => Temporal.PlainTime;

      /**
       * Get the environment's current time zone.
       *
       * This method gets the current system time zone. This will usually be a
       * named
       * {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones|IANA time zone}.
       */
      timeZone: () => Temporal.TimeZone;

      readonly [Symbol.toStringTag]: 'Temporal.Now';
    };
  }

  interface Date {
    toTemporalInstant(): Temporal.Instant;
  }
}
export {};
