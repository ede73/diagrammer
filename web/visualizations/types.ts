// Types for Web Visualizations parsed from Diagrammer JSON outputs

export interface SankeyNodeT {
  name: string
}

export interface SankeyLinkT {
  source: number
  target: number
  value: number
}

export interface SankeyDocumentT {
  nodes: SankeyNodeT[]
  links: SankeyLinkT[]
}

export interface DendrogramDocument {
  name: string
  children: Array<ThisType<this>>
  size?: number
  nodecolor?: string
  nodeshape?: string
  nodelabel?: string
  edgecolor?: string
  radial?: number
}

export type RelationshipTypeT = 'association' | 'dependency' | 'generalization' | 'realization' | 'composition' | 'aggregation'

export type UMLClassDocumentT = [
  ClassDeclarationT[],
  RelationshipT[]
]

export interface ParameterTypeT {
  name: string
  type?: string
}

export interface MethodDeclarationT {
  name: string
  visibility: string
  type: string
  parameters?: ParameterTypeT[]
  scope?: string
}

export interface MemberDeclarationT {
  name: string
  visibility: string
  type: string
  default?: string
  scope?: string
}

export interface ClassDeclarationT {
  key: number
  name: string
  properties: MemberDeclarationT[]
  methods: MethodDeclarationT[]
}

export interface RelationshipT {
  from: number
  to: number
  relationship: RelationshipTypeT
  label?: string
}
