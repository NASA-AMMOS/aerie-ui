import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MaterialModule } from '../../material';
import { ContextMenuTriggerModule } from '../context-menu-trigger';
import { ActivityBandModule } from './activity-band';
import { BandComponent } from './band.component';
import { LineBandModule } from './line-band';
import { XRangeBandModule } from './x-range-band';

@NgModule({
  declarations: [BandComponent],
  exports: [BandComponent],
  imports: [
    ActivityBandModule,
    CommonModule,
    ContextMenuTriggerModule,
    LineBandModule,
    MaterialModule,
    XRangeBandModule,
  ],
})
export class BandModule {}
