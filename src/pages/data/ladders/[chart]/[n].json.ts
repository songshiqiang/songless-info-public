import type { APIRoute } from 'astro';
import { ladderSongs, worldSchedule } from '../../../../data/songs';

export function getStaticPaths() {
  return Object.entries(worldSchedule).flatMap(([chart, schedule]) =>
    Object.keys(schedule).map((n) => ({ params: { chart, n } }))
  );
}

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(ladderSongs(worldSchedule[params.chart!][params.n!])));
