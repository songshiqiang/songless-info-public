import type { APIRoute } from 'astro';
import { ladderSongs, schedule } from '../../../data/songs';

export function getStaticPaths() {
  return Object.keys(schedule).map((n) => ({ params: { n } }));
}

export const GET: APIRoute = ({ params }) => {
  return new Response(JSON.stringify(ladderSongs(schedule[params.n!])));
};
