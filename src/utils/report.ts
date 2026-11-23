import { Vehicle, Driver, Maintenance, Fueling } from '../types';
import { STATUS_LABEL } from './status';
import { formatMoney, formatKm } from './format';
import { averageConsumption } from './fuel';
import { getMaintenanceAlerts } from './alerts';

export interface ReportData {
  vehicles: Vehicle[];
  drivers: Driver[];
  maintenances: Maintenance[];
  fuelings: Fueling[];
}

const fmtConsumption = (c: number | null) =>
  c === null ? '-' : `${c.toFixed(1).replace('.', ',')} km/l`;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function summarize(v: Vehicle, d: ReportData) {
  const maint = d.maintenances.filter((m) => m.vehicleId === v.id);
  const fuel = d.fuelings.filter((f) => f.vehicleId === v.id);
  return {
    vehicle: v,
    driver: d.drivers.find((x) => x.id === v.driverId)?.name ?? '-',
    maintCost: maint.reduce((s, m) => s + m.cost, 0),
    fuelCost: fuel.reduce((s, f) => s + f.totalCost, 0),
    consumption: averageConsumption(fuel),
  };
}

function totals(d: ReportData) {
  const maint = d.maintenances.reduce((s, m) => s + m.cost, 0);
  const fuel = d.fuelings.reduce((s, f) => s + f.totalCost, 0);
  return { maint, fuel, total: maint + fuel };
}

export function buildReportText(d: ReportData): string {
  const t = totals(d);
  const alerts = getMaintenanceAlerts(d.vehicles, d.maintenances);
  const lines: string[] = [
    `RELATÓRIO DA FROTA - ${new Date().toLocaleDateString('pt-BR')}`,
    '',
    `Veículos: ${d.vehicles.length}`,
    `Motoristas: ${d.drivers.length}`,
    `Gasto com manutenção: ${formatMoney(t.maint)}`,
    `Gasto com combustível: ${formatMoney(t.fuel)}`,
    `Gasto total: ${formatMoney(t.total)}`,
    '',
    'VEÍCULOS',
  ];

  d.vehicles.forEach((v) => {
    const s = summarize(v, d);
    lines.push(
      '',
      `${v.plate} - ${v.brand} ${v.model} (${v.year})`,
      `Status: ${STATUS_LABEL[v.status]} | Motorista: ${s.driver}`,
      `Quilometragem: ${formatKm(v.mileage)}`,
      `Manutenção: ${formatMoney(s.maintCost)} | Combustível: ${formatMoney(s.fuelCost)}`,
      `Consumo médio: ${fmtConsumption(s.consumption)}`
    );
  });

  lines.push('', 'ALERTAS DE MANUTENÇÃO');
  if (alerts.length === 0) {
    lines.push('Nenhum alerta.');
  } else {
    alerts.forEach((a) =>
      lines.push(
        `- ${a.vehicle.plate}: ${formatKm(a.kmSince)} desde a última manutenção`
      )
    );
  }
  return lines.join('\n');
}

export function buildReportHtml(d: ReportData): string {
  const t = totals(d);
  const alerts = getMaintenanceAlerts(d.vehicles, d.maintenances);

  const rows = d.vehicles
    .map((v) => {
      const s = summarize(v, d);
      return `<tr>
        <td>${esc(v.plate)}</td>
        <td>${esc(v.brand)} ${esc(v.model)} (${v.year})</td>
        <td>${STATUS_LABEL[v.status]}</td>
        <td>${esc(s.driver)}</td>
        <td>${formatKm(v.mileage)}</td>
        <td>${formatMoney(s.maintCost)}</td>
        <td>${formatMoney(s.fuelCost)}</td>
        <td>${fmtConsumption(s.consumption)}</td>
      </tr>`;
    })
    .join('');

  const alertItems =
    alerts.length === 0
      ? '<p>Nenhum alerta.</p>'
      : `<ul>${alerts
          .map(
            (a) =>
              `<li><b>${esc(a.vehicle.plate)}</b>: ${formatKm(a.kmSince)} desde a última manutenção</li>`
          )
          .join('')}</ul>`;

  return `<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
      h1 { color: #1565c0; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
      th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
      th { background: #1565c0; color: #fff; }
      .box { display: inline-block; margin: 8px 12px 8px 0; padding: 10px 14px; background: #eee; border-radius: 6px; }
    </style>
  </head>
  <body>
    <h1>Relatório da Frota</h1>
    <p>${new Date().toLocaleDateString('pt-BR')}</p>
    <div class="box">Veículos: <b>${d.vehicles.length}</b></div>
    <div class="box">Motoristas: <b>${d.drivers.length}</b></div>
    <div class="box">Manutenção: <b>${formatMoney(t.maint)}</b></div>
    <div class="box">Combustível: <b>${formatMoney(t.fuel)}</b></div>
    <div class="box">Total: <b>${formatMoney(t.total)}</b></div>
    <h2>Veículos</h2>
    <table>
      <tr>
        <th>Placa</th><th>Veículo</th><th>Status</th><th>Motorista</th>
        <th>Km</th><th>Manutenção</th><th>Combustível</th><th>Consumo</th>
      </tr>
      ${rows}
    </table>
    <h2>Alertas de manutenção</h2>
    ${alertItems}
  </body>
</html>`;
}
