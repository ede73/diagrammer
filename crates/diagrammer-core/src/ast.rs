use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Allowed defaults in GraphContainer
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct AllowedDefaults {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub edgecolor: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub groupcolor: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vertexcolor: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vertextextcolor: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub edgetextcolor: Option<String>,
}

/// Compass direction / port for edges (e.g., :n, :ne, :e, :se, :s, :sw, :w, :nw)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum CompassPoint {
    N,
    Ne,
    E,
    Se,
    S,
    Sw,
    W,
    Nw,
    Custom(String),
}

/// Compact representation of a vertex reference in edges and root vertices
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VertexRef {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shape: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

impl VertexRef {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            label: None,
            shape: None,
            image: None,
            style: None,
            color: None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ArrowType {
    None,
    Normal,
    Double,
    Flat,
}

/// Compact edge reference
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct EdgeRef {
    #[serde(rename = "edgeType")]
    pub edge_type: String,
    pub left: String,
    pub right: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub textcolor: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lcompass: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rcompass: Option<String>,
    #[serde(skip)]
    pub parent: Option<String>,
}

pub type GraphEdge = EdgeRef;

impl EdgeRef {
    pub fn new(edge_type: impl Into<String>, left: impl Into<String>, right: impl Into<String>) -> Self {
        Self {
            edge_type: edge_type.into(),
            left: left.into(),
            right: right.into(),
            label: None,
            color: None,
            textcolor: None,
            lcompass: None,
            rcompass: None,
            parent: None,
        }
    }

    pub fn line_type(&self) -> &str {
        for c in self.edge_type.chars().rev() {
            match c {
                '.' => return "dotted",
                '-' => return "dashed",
                '=' => return "double",
                '/' => return "broken",
                _ => {}
            }
        }
        "normal"
    }

    pub fn left_arrow_type(&self) -> ArrowType {
        if self.edge_type.starts_with("<<") {
            ArrowType::Double
        } else if self.edge_type.starts_with('<') {
            ArrowType::Normal
        } else if self.edge_type.starts_with('|') {
            ArrowType::Flat
        } else {
            ArrowType::None
        }
    }

    pub fn right_arrow_type(&self) -> ArrowType {
        if self.edge_type.ends_with(">>") {
            ArrowType::Double
        } else if self.edge_type.ends_with('>') {
            ArrowType::Normal
        } else if self.edge_type.ends_with('|') {
            ArrowType::Flat
        } else {
            ArrowType::None
        }
    }
}

/// Objects contained in a GraphContainer
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum GraphObject {
    Edge {
        #[serde(rename = "GraphEdge")]
        edge: EdgeRef,
    },
    VertexRef {
        #[serde(rename = "GraphVertex")]
        vertex: VertexRef,
    },
    Group(Box<GraphGroup>),
    Vertex(GraphVertex),
    Reference(GraphReference),
}

impl GraphObject {
    pub fn get_name(&self) -> &str {
        match self {
            GraphObject::Edge { .. } => "",
            GraphObject::VertexRef { vertex } => &vertex.name,
            GraphObject::Group(g) => &g.name,
            GraphObject::Vertex(v) => &v.name,
            GraphObject::Reference(r) => &r.name,
        }
    }

    pub fn get_label(&self) -> Option<&str> {
        match self {
            GraphObject::Group(g) => g.label.as_deref(),
            GraphObject::Vertex(v) => v.label.as_deref(),
            GraphObject::VertexRef { vertex } => vertex.label.as_deref(),
            GraphObject::Edge { edge } => edge.label.as_deref(),
            GraphObject::Reference(_) => None,
        }
    }

    pub fn get_color(&self) -> Option<&str> {
        match self {
            GraphObject::Group(g) => g.color.as_deref(),
            GraphObject::Vertex(v) => v.color.as_deref(),
            GraphObject::VertexRef { vertex } => vertex.color.as_deref(),
            GraphObject::Edge { edge } => edge.color.as_deref(),
            GraphObject::Reference(_) => None,
        }
    }

    pub fn get_textcolor(&self) -> Option<&str> {
        match self {
            GraphObject::Group(g) => g.textcolor.as_deref(),
            GraphObject::Vertex(v) => v.textcolor.as_deref(),
            GraphObject::Edge { edge } => edge.textcolor.as_deref(),
            _ => None,
        }
    }

    pub fn get_shape(&self) -> Option<&str> {
        match self {
            GraphObject::Vertex(v) => v.shape.as_deref(),
            GraphObject::VertexRef { vertex } => vertex.shape.as_deref(),
            GraphObject::Reference(r) => r.shape.as_deref(),
            _ => None,
        }
    }

    pub fn get_image(&self) -> Option<&str> {
        match self {
            GraphObject::Vertex(v) => v.image.as_deref(),
            GraphObject::VertexRef { vertex } => vertex.image.as_deref(),
            GraphObject::Reference(r) => r.image.as_deref(),
            _ => None,
        }
    }

    pub fn get_style(&self) -> Option<&str> {
        match self {
            GraphObject::Vertex(v) => v.style.as_deref(),
            GraphObject::VertexRef { vertex } => vertex.style.as_deref(),
            _ => None,
        }
    }

    pub fn is_group(&self) -> bool {
        matches!(self, GraphObject::Group(_))
    }

    pub fn is_reference(&self) -> bool {
        matches!(self, GraphObject::Reference(_))
    }

    pub fn is_vertex(&self) -> bool {
        matches!(self, GraphObject::Vertex(_) | GraphObject::VertexRef { .. })
    }

    pub fn is_edge(&self) -> bool {
        matches!(self, GraphObject::Edge { .. })
    }
}

/// Canonical GraphVertex representation
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GraphVertex {
    #[serde(rename = "__PSEUDOTYPE")]
    pub pseudo_type: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shape: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub textcolor: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

impl GraphVertex {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            pseudo_type: "GraphVertex".to_string(),
            name: name.into(),
            label: None,
            shape: None,
            image: None,
            style: None,
            color: None,
            textcolor: None,
            url: None,
        }
    }
}

/// Canonical GraphReference representation
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GraphReference {
    #[serde(rename = "__PSEUDOTYPE")]
    pub pseudo_type: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shape: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<String>,
}

impl GraphReference {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            pseudo_type: "GraphReference".to_string(),
            name: name.into(),
            shape: None,
            image: None,
        }
    }
}

/// Canonical GraphGroup / Subgraph / Container representation
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GraphGroup {
    #[serde(rename = "__PSEUDOTYPE")]
    pub pseudo_type: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(rename = "_ROOTVERTICES")]
    pub root_vertices: Vec<GraphObject>,
    pub defaults: AllowedDefaults,
    pub equal: Vec<GraphObject>,
    #[serde(rename = "_OBJECTS")]
    pub objects: Vec<GraphObject>,
    #[serde(rename = "isInnerGraph")]
    pub is_inner_graph: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exitvertex: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conditional: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub textcolor: Option<String>,
}

impl GraphGroup {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            pseudo_type: "GraphGroup".to_string(),
            name: name.into(),
            label: None,
            root_vertices: Vec::new(),
            defaults: AllowedDefaults::default(),
            equal: Vec::new(),
            objects: Vec::new(),
            is_inner_graph: false,
            exitvertex: None,
            conditional: None,
            color: None,
            textcolor: None,
        }
    }

    pub fn get_objects(&self, allow_references: bool) -> Vec<&GraphObject> {
        self.objects
            .iter()
            .filter(|obj| match obj {
                GraphObject::Edge { .. } => false,
                GraphObject::Reference(_) => allow_references,
                _ => true,
            })
            .collect()
    }

    /// Recursively flattens all groups and returns only Vertex / VertexRef objects in declaration order.
    pub fn get_flattened_vertices(&self) -> Vec<&GraphObject> {
        fn collect<'a>(objects: &'a [GraphObject], out: &mut Vec<&'a GraphObject>) {
            for obj in objects {
                match obj {
                    GraphObject::Group(grp) => collect(&grp.objects, out),
                    GraphObject::Vertex(_) | GraphObject::VertexRef { .. } => out.push(obj),
                    _ => {}
                }
            }
        }
        let mut out = Vec::new();
        collect(&self.objects, &mut out);
        out
    }

    /// Recursively collects the names of all Group containers in the canvas.
    pub fn get_group_names(&self) -> std::collections::HashSet<String> {
        fn collect(objects: &[GraphObject], out: &mut std::collections::HashSet<String>) {
            for obj in objects {
                if let GraphObject::Group(grp) = obj {
                    if !grp.name.is_empty() {
                        out.insert(grp.name.clone());
                    }
                    collect(&grp.objects, out);
                }
            }
        }
        let mut out = std::collections::HashSet::new();
        collect(&self.objects, &mut out);
        out
    }
}

/// Parsing context state captured during parse
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct ParsingContext {
    #[serde(rename = "CURRENTCONTAINER", skip_serializing_if = "Option::is_none")]
    pub current_container: Option<String>,
    #[serde(rename = "CONTAINER_EXIT", skip_serializing_if = "Option::is_none")]
    pub container_exit: Option<usize>,
    #[serde(rename = "GRAPHINNER_INDEX", skip_serializing_if = "Option::is_none")]
    pub graphinner_index: Option<usize>,
    #[serde(rename = "GROUPIDS", skip_serializing_if = "Option::is_none")]
    pub group_ids: Option<usize>,
    #[serde(rename = "VARIABLES", default)]
    pub variables: HashMap<String, String>,
}

/// Top-level AST Canvas representation
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GraphCanvas {
    #[serde(rename = "__PSEUDOTYPE")]
    pub pseudo_type: String,
    pub name: String,
    #[serde(rename = "_ROOTVERTICES")]
    pub root_vertices: Vec<GraphObject>,
    pub defaults: AllowedDefaults,
    pub equal: Vec<GraphObject>,
    #[serde(rename = "_OBJECTS")]
    pub objects: Vec<GraphObject>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub visualizer: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub direction: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shape: Option<String>,
    #[serde(rename = "parsingContext", skip_serializing_if = "Option::is_none")]
    pub parsing_context: Option<ParsingContext>,
}

impl Default for GraphCanvas {
    fn default() -> Self {
        Self {
            pseudo_type: "GraphCanvas".to_string(),
            name: String::new(),
            root_vertices: Vec::new(),
            defaults: AllowedDefaults::default(),
            equal: Vec::new(),
            objects: Vec::new(),
            visualizer: None,
            direction: None,
            start: None,
            shape: None,
            parsing_context: None,
        }
    }
}

impl GraphCanvas {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_edges(&self) -> Vec<&EdgeRef> {
        self.objects
            .iter()
            .filter_map(|obj| match obj {
                GraphObject::Edge { edge } => Some(edge),
                _ => None,
            })
            .collect()
    }

    pub fn get_objects(&self, allow_references: bool) -> Vec<&GraphObject> {
        self.objects
            .iter()
            .filter(|obj| match obj {
                GraphObject::Edge { .. } => false,
                GraphObject::Reference(_) => allow_references,
                _ => true,
            })
            .collect()
    }

    /// Recursively flattens all groups and returns only Vertex / VertexRef objects in declaration order.
    pub fn get_flattened_vertices(&self) -> Vec<&GraphObject> {
        fn collect<'a>(objects: &'a [GraphObject], out: &mut Vec<&'a GraphObject>) {
            for obj in objects {
                match obj {
                    GraphObject::Group(grp) => collect(&grp.objects, out),
                    GraphObject::Vertex(_) | GraphObject::VertexRef { .. } => out.push(obj),
                    _ => {}
                }
            }
        }
        let mut out = Vec::new();
        collect(&self.objects, &mut out);
        out
    }

    /// Recursively collects the names of all Group containers in the canvas.
    pub fn get_group_names(&self) -> std::collections::HashSet<String> {
        fn collect(objects: &[GraphObject], out: &mut std::collections::HashSet<String>) {
            for obj in objects {
                if let GraphObject::Group(grp) = obj {
                    if !grp.name.is_empty() {
                        out.insert(grp.name.clone());
                    }
                    collect(&grp.objects, out);
                }
            }
        }
        let mut out = std::collections::HashSet::new();
        collect(&self.objects, &mut out);
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ast_serialization() {
        let mut canvas = GraphCanvas::new();
        canvas.visualizer = Some("ast".to_string());
        canvas.direction = Some("portrait".to_string());
        canvas.defaults.edgecolor = Some("#ff0000".to_string());

        let mut group = GraphGroup::new("G1");
        group.label = Some("Group 1".to_string());
        group.objects.push(GraphObject::VertexRef {
            vertex: VertexRef::new("nodeA"),
        });

        canvas.objects.push(GraphObject::Group(Box::new(group)));
        canvas.objects.push(GraphObject::Edge {
            edge: EdgeRef::new(">", "nodeA", "nodeB"),
        });

        let json = serde_json::to_string_pretty(&canvas).unwrap();
        assert!(json.contains("\"__PSEUDOTYPE\": \"GraphCanvas\""));
        assert!(json.contains("\"edgecolor\": \"#ff0000\""));

        let deserialized: GraphCanvas = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.visualizer.as_deref(), Some("ast"));
        assert_eq!(deserialized.objects.len(), 2);
    }
}
