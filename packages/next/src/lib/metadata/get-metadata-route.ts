import { isMetadataRoute, isMetadataRouteFile } from './is-metadata-route'
import path from '../../shared/lib/isomorphic/path'
import { djb2Hash } from '../../shared/lib/hash'

/*
 * If there's special convention like (...) or @ in the page path,
 * Give it a unique hash suffix to avoid conflicts
 *
 * e.g.
 * /app/open-graph.tsx -> /open-graph/route
 * /app/(post)/open-graph.tsx -> /open-graph/route-[0-9a-z]{6}
 */
export function getMetadataRouteSuffix(page: string) {
  let suffix = ''

  if ((page.includes('(') && page.includes(')')) || page.includes('@')) {
    suffix = djb2Hash(page).toString(36).slice(0, 6)
  }
  return suffix
}

/**
 * Map metadata page key to the corresponding route
 *
 * static file page key:    /app/robots.txt -> /robots.xml -> /robots.txt/route
 * dynamic route page key:  /app/robots.tsx -> /robots -> /robots.txt/route
 *
 * @param page
 * @returns
 */
export function normalizeMetadataRoute(page: string) {
  if (!isMetadataRoute(page)) {
    return page
  }
  let route = page
  let suffix = ''
  if (route === '/robots') {
    route += '.txt'
  } else if (route === '/manifest') {
    route += '.webmanifest'
  } else if (route.endsWith('/sitemap')) {
    route += '.xml'
  } else {
    // Remove the file extension, e.g. /route-path/robots.txt -> /route-path
    const pathnamePrefix = page.slice(0, -(path.basename(page).length + 1))
    suffix = getMetadataRouteSuffix(pathnamePrefix)
  }
  // Support both /<metadata-route.ext> and custom routes /<metadata-route>/route.ts.
  // If it's a metadata file route, we need to append /[id]/route to the page.
  if (!route.endsWith('/route')) {
    const isStaticMetadataFile = isMetadataRouteFile(page, [], true)
    const { dir, name: baseName, ext } = path.parse(route)

    const isStaticRoute =
      page.startsWith('/robots') ||
      page.startsWith('/manifest') ||
      isStaticMetadataFile

    route = path.posix.join(
      dir,
      `${baseName}${suffix ? `-${suffix}` : ''}${ext}`,
      isStaticRoute ? '' : '[[...__metadata_id__]]',
      'route'
    )
  }

  return route
}
