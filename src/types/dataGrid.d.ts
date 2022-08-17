type DataGridColumnDef = import('ag-grid-community').ColDef;

interface DataGridRowSelection<TRowData> {
  data: TRowData;
  isSelected: boolean;
}

type DataGridRowsSelection<TRowData> = TRowData[];

interface ICellRendererParams {
  data: TRowData;
}

type TRowData = any;
