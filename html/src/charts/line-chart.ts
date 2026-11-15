import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
} from "chart.js";
import { chartKind } from "./chart-base";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler);
chartKind("line");
