// Type definitions for Next.js routes

/**
 * Internal types used by the Next.js router and Link component.
 * These types are not meant to be used directly.
 * @internal
 */
declare namespace __next_route_internal_types__ {
  type SearchOrHash = `?${string}` | `#${string}`
  type WithProtocol = `${string}:${string}`

  type Suffix = '' | SearchOrHash

  type SafeSlug<S extends string> = S extends `${string}/${string}`
    ? never
    : S extends `${string}${SearchOrHash}`
    ? never
    : S extends ''
    ? never
    : S

  type CatchAllSlug<S extends string> = S extends `${string}${SearchOrHash}`
    ? never
    : S extends ''
    ? never
    : S

  type OptionalCatchAllSlug<S extends string> =
    S extends `${string}${SearchOrHash}` ? never : S

  type StaticRoutes = 
    | `/`
    | `/compliance`
    | `/dashboard`
    | `/settings`
    | `/properties`
    | `/_archive/content`
    | `/`
    | `/features`
    | `/pricing`
    | `/login`
    | `/register`
    | `/agents`
    | `/api/agents/sales`
    | `/api/agents/service`
    | `/api/agents/support`
    | `/api/approve`
    | `/api/budget/status`
    | `/api/aura-fx/analyze`
    | `/api/aura-fx/broadcast`
    | `/api/aura-fx/signal`
    | `/api/aura-fx/signal/update`
    | `/api/compliance/fica`
    | `/api/driver-intel`
    | `/api/council/governance`
    | `/api/council/outcome`
    | `/api/feedback`
    | `/api/draft`
    | `/api/health`
    | `/api/health/enterprise`
    | `/api/health/models`
    | `/api/exec-summary/list`
    | `/api/exec-summary/load`
    | `/api/exec-summary/pdf`
    | `/api/exec-summary/pdf`
    | `/api/exec-summary/save`
    | `/api/generate`
    | `/api/generate/description`
    | `/api/models/benchmark`
    | `/api/models/init`
    | `/api/models/status`
    | `/api/pilot/apply`
    | `/api/publish`
    | `/api/oauth/linkedin/callback`
    | `/api/oauth/linkedin/start`
    | `/api/onboard/confirm`
    | `/api/onboard/extract`
    | `/api/intelligence`
    | `/api/railway-webhook`
    | `/api/status`
    | `/api/upload`
    | `/api/retention/notes`
    | `/api/ready`
    | `/api/risk/calculate-position`
    | `/api/waitlist`
    | `/admin`
    | `/admin/integrations`
    | `/_decision-studio-disabled`
    | `/content`
    | `/create`
    | `/auth/callback`
    | `/decision-lab`
    | `/executive-summary`
    | `/exec-summary`
    | `/luxgrid/colors`
    | `/noid-intel`
    | `/demo`
    | `/insights`
    | `/noid-showcase`
    | `/onboard`
    | `/pilot`
    | `/pilot/apply`
    | `/pilot/apply/success`
    | `/q-preview`
    | `/statusq-preview`
    | `/studio`
    | `/studio/exec-summary`
    | `/waitlist`
    | `/waitlist/success`
    | `/synqra-lab`
  type DynamicRoutes<T extends string = string> = never

  type RouteImpl<T> = 
    | StaticRoutes
    | SearchOrHash
    | WithProtocol
    | `${StaticRoutes}${SearchOrHash}`
    | (T extends `${DynamicRoutes<infer _>}${Suffix}` ? T : never)
    
}

declare module 'next' {
  export { default } from 'next/types.js'
  export * from 'next/types.js'

  export type Route<T extends string = string> =
    __next_route_internal_types__.RouteImpl<T>
}

declare module 'next/link' {
  import type { LinkProps as OriginalLinkProps } from 'next/dist/client/link.js'
  import type { AnchorHTMLAttributes, DetailedHTMLProps } from 'react'
  import type { UrlObject } from 'url'

  type LinkRestProps = Omit<
    Omit<
      DetailedHTMLProps<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        HTMLAnchorElement
      >,
      keyof OriginalLinkProps
    > &
      OriginalLinkProps,
    'href'
  >

  export type LinkProps<RouteInferType> = LinkRestProps & {
    /**
     * The path or URL to navigate to. This is the only required prop. It can also be an object.
     * @see https://nextjs.org/docs/api-reference/next/link
     */
    href: __next_route_internal_types__.RouteImpl<RouteInferType> | UrlObject
  }

  export default function Link<RouteType>(props: LinkProps<RouteType>): JSX.Element
}

declare module 'next/navigation' {
  export * from 'next/dist/client/components/navigation.js'

  import type { NavigateOptions, AppRouterInstance as OriginalAppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
  interface AppRouterInstance extends OriginalAppRouterInstance {
    /**
     * Navigate to the provided href.
     * Pushes a new history entry.
     */
    push<RouteType>(href: __next_route_internal_types__.RouteImpl<RouteType>, options?: NavigateOptions): void
    /**
     * Navigate to the provided href.
     * Replaces the current history entry.
     */
    replace<RouteType>(href: __next_route_internal_types__.RouteImpl<RouteType>, options?: NavigateOptions): void
    /**
     * Prefetch the provided href.
     */
    prefetch<RouteType>(href: __next_route_internal_types__.RouteImpl<RouteType>): void
  }

  export function useRouter(): AppRouterInstance;
}

declare module 'next/form' {
  import type { FormProps as OriginalFormProps } from 'next/dist/client/form.js'

  type FormRestProps = Omit<OriginalFormProps, 'action'>

  export type FormProps<RouteInferType> = {
    /**
     * `action` can be either a `string` or a function.
     * - If `action` is a string, it will be interpreted as a path or URL to navigate to when the form is submitted.
     *   The path will be prefetched when the form becomes visible.
     * - If `action` is a function, it will be called when the form is submitted. See the [React docs](https://react.dev/reference/react-dom/components/form#props) for more.
     */
    action: __next_route_internal_types__.RouteImpl<RouteInferType> | ((formData: FormData) => void)
  } & FormRestProps

  export default function Form<RouteType>(props: FormProps<RouteType>): JSX.Element
}
