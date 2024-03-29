export type ModalElementValue<T = any> = {
  confirm: boolean;
  value?: T;
};

export type ModalElementResolve = {
  resolve: ((value: ModalElementValue | PromiseLike<ModalElementValue>) => void) | null;
};

export type ModalElement = HTMLDivElement & ModalElementResolve;
