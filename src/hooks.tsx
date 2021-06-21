import {useLocation} from 'react-router';

export const useURLSearch = () => {
  return new URLSearchParams(useLocation().search).get('search') || '';
}

const pageURL = (page: number, search: string) => {
  let base = `/page/${page}`;
  if (search) {
    base += `?search=${encodeURIComponent(search)}`;
  }
  return base;
}