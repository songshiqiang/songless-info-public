import type { APIRoute } from 'astro';
import { CHARTS, type Chart } from '../../../lib/game';
import { refs } from '../../../data/songs';

export function getStaticPaths() {
  return CHARTS.map((chart) => ({ params: { chart: chart.toLowerCase() }, props: { chart } }));
}

export const GET: APIRoute<{ chart: Chart }> = ({ props }) => new Response(JSON.stringify(refs(props.chart)));
