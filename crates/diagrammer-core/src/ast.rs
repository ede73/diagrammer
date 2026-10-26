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
}

/// Compact edge reference
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct EdgeRef {
    #[serde(rename = "edgeType")]
    pub edge_type: String,
    pub left: String,
    pub right: String,
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
            vertex: VertexRef {
                name: "nodeA".to_string(),
            },
        });

        canvas.objects.push(GraphObject::Group(Box::new(group)));
        canvas.objects.push(GraphObject::Edge {
            edge: EdgeRef {
                edge_type: ">".to_string(),
                left: "nodeA".to_string(),
                right: "nodeB".to_string(),
            },
        });

        let json = serde_json::to_string_pretty(&canvas).unwrap();
        assert!(json.contains("\"__PSEUDOTYPE\": \"GraphCanvas\""));
        assert!(json.contains("\"edgecolor\": \"#ff0000\""));

        let deserialized: GraphCanvas = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.visualizer.as_deref(), Some("ast"));
        assert_eq!(deserialized.objects.len(), 2);
    }
}
