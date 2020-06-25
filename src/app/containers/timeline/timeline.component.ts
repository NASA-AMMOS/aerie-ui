import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgModule,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { PlanningActions } from '../../actions';
import { RootState } from '../../app-store';
import { TimeAxisGlobalModule, TimeAxisModule } from '../../components';
import { BandModule } from '../../components/band/band.component';
import { PipesModule } from '../../pipes';
import {
  Band,
  CreateActivityInstance,
  CreatePoint,
  DeletePoint,
  Guide,
  GuideDialogData,
  SavePoint,
  SelectPoint,
  StringTMap,
  TimeRange,
  UpdatePoint,
  Violation,
} from '../../types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-timeline',
  styleUrls: ['./timeline.component.css'],
  templateUrl: './timeline.component.html',
})
export class TimelineComponent implements OnChanges, AfterViewChecked {
  @Input()
  bands: Band[] | null | undefined;

  @Input()
  constraintViolations: Violation[] = [];

  @Input()
  marginBottom = 10;

  @Input()
  marginLeft = 100;

  @Input()
  marginRight = 40;

  @Input()
  marginTop = 10;

  @Input()
  maxTimeRange: TimeRange = { end: 0, start: 0 };

  @Input()
  verticalGuides: Guide[];

  @Input()
  viewTimeRange: TimeRange = { end: 0, start: 0 };

  @ViewChild('bandContainer', { static: true })
  bandContainer: ElementRef<HTMLDivElement>;

  @ViewChild('timeAxisContainer', { static: true })
  timeAxisContainer: ElementRef<HTMLDivElement>;

  public filteredConstraintViolations: StringTMap<Violation[]>;

  constructor(
    private elRef: ElementRef,
    private route: ActivatedRoute,
    private store: Store<RootState>,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.bands || changes.constraintViolations) {
      this.filterConstraintViolations(this.constraintViolations);
    }
  }

  ngAfterViewChecked(): void {
    this.setBandContainerMaxHeight();
  }

  /**
   * @todo This function will simplify when we have actual constraint violations.
   */
  filterConstraintViolations(violations: Violation[]) {
    this.filteredConstraintViolations = {};

    for (const violation of violations) {
      const { activityInstanceIds, stateIds } = violation.associations;
      const bands = this.bands || [];
      for (const band of bands) {
        const { subBands } = band;
        for (const subBand of subBands) {
          const { type } = subBand;
          if (type === 'activity' && activityInstanceIds.length) {
            for (const activityInstanceId of activityInstanceIds) {
              if (activityInstanceId === subBand.id) {
                if (!this.filteredConstraintViolations[band.id]) {
                  this.filteredConstraintViolations[band.id] = [];
                }
                this.filteredConstraintViolations[band.id].push(violation);
              }
            }
          }
          if (type === 'state' && stateIds.length) {
            for (const stateId of stateIds) {
              if (stateId === subBand.id) {
                if (!this.filteredConstraintViolations[band.id]) {
                  this.filteredConstraintViolations[band.id] = [];
                }
                this.filteredConstraintViolations[band.id].push(violation);
              }
            }
          }
        }
      }
    }
  }

  onDeleteHorizontalGuide(guide: Guide): void {
    this.store.dispatch(PlanningActions.guideRemove({ guide }));
  }

  onOpenGuideDialog(data: GuideDialogData): void {
    this.store.dispatch(PlanningActions.guideOpenDialog({ data }));
  }

  onUpdateHorizontalGuide(guide: Partial<Guide>): void {
    this.store.dispatch(
      PlanningActions.guideUpdate({ id: guide.id, changes: guide }),
    );
  }

  onCreatePoint(event: CreatePoint): void {
    if (event.type === 'activity') {
      const { id: planId } = this.route.snapshot.params;
      const activityType = event.activityType;
      const activityInstance: CreateActivityInstance = {
        parameters: [],
        startTimestamp: event.startTimestamp,
        type: activityType.name,
      };
      this.store.dispatch(
        PlanningActions.createActivityInstance({ planId, activityInstance }),
      );
    }
  }

  onDeletePoint(event: DeletePoint): void {
    if (event.type === 'activity') {
      const { id: planId } = this.route.snapshot.params;
      this.store.dispatch(
        PlanningActions.deleteActivityInstance({
          activityInstanceId: event.id,
          planId,
        }),
      );
    }
  }

  onSavePoint(event: SavePoint): void {
    if (event.type === 'activity') {
      const { id: planId } = this.route.snapshot.params;
      this.store.dispatch(
        PlanningActions.updateActivityInstance({
          activityInstance: { ...event.value, id: event.id },
          planId,
        }),
      );
    }
  }

  onSelectPoint(event: SelectPoint): void {
    if (event.type === 'activity') {
      this.store.dispatch(
        PlanningActions.setSelectedActivityInstanceId({
          keepSelected: true,
          selectedActivityInstanceId: event.id,
        }),
      );
    }
  }

  onUpdatePoint(event: UpdatePoint): void {
    if (event.type === 'activity') {
      this.store.dispatch(
        PlanningActions.updateActivityInstanceSuccess({
          activityInstance: { ...event.value, id: event.id },
        }),
      );
    }
  }

  onUpdateViewTimeRange(viewTimeRange: TimeRange): void {
    this.store.dispatch(PlanningActions.updateViewTimeRange({ viewTimeRange }));
  }

  setBandContainerMaxHeight() {
    const cssStyle = getComputedStyle(document.documentElement);
    const toolbarHeightProperty = cssStyle.getPropertyValue('--toolbar-height');
    const toolbarHeight = parseInt(toolbarHeightProperty, 10);

    const { clientHeight: height } = this.elRef.nativeElement.parentElement;
    const { nativeElement: timeAxisContainer } = this.timeAxisContainer;
    const { nativeElement: bandContainer } = this.bandContainer;
    const offsetTop = toolbarHeight + timeAxisContainer.clientHeight;
    const maxHeight = `${height - offsetTop}px`;

    bandContainer.style.setProperty('--max-height', maxHeight);
  }

  trackByBands(_: number, band: Band): string {
    return band.id;
  }
}

@NgModule({
  declarations: [TimelineComponent],
  exports: [TimelineComponent],
  imports: [
    BandModule,
    CommonModule,
    PipesModule,
    TimeAxisModule,
    TimeAxisGlobalModule,
  ],
})
export class TimelineModule {}
