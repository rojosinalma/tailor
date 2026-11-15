import { ArcElement, Chart, DoughnutController } from "chart.js";
import { chartKind } from "./chart-base";

Chart.register(DoughnutController, ArcElement);
chartKind("donut");
