import { BarController, BarElement, CategoryScale, Chart, LinearScale } from "chart.js";
import { chartKind } from "./chart-base";

Chart.register(BarController, BarElement, LinearScale, CategoryScale);
chartKind("bar");
