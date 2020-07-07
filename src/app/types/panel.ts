import { Band, Guide } from './band';
import { Violation } from './simulation';

export type PanelMenuItemAction = 'link' | 'restore' | 'simulate';

export interface PanelMenuItem {
  action: PanelMenuItemAction;
  data?: {
    url?: string;
  };
  icon: string;
  title: string;
}

export interface Panel {
  bands?: Band[];
  constraintViolations?: Violation[];
  id: string;
  iframe?: {
    src: string;
  };
  menu?: PanelMenuItem[];
  table?: {
    columns: string[];
    type: 'activity';
  };
  title: string;
  type: 'iframe' | 'table' | 'timeline';
  verticalGuides?: Guide[];
}
