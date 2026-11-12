#!/bin/bash
set -e

mkdir -p docs/images/layout_engines

# 1. Force diagrams
echo 'visualizer force
Hub_Switch > (Node_01, Node_02, Node_03, Node_04, Node_05, Node_06)
Node_01 > Node_02 > Node_03 > Node_04 > Node_05 > Node_06 > Node_01' | ./diagrammer force -o docs/images/layout_engines/force_1_network.png

echo 'visualizer force
Alice > (Bob, Charlie, David, Eve)
Bob > (Charlie, David, Frank)
Charlie > (David, Eve, Grace)
David > (Eve, Frank, Grace)
Eve > (Frank, Grace, Heidi)
Frank > (Grace, Heidi)
Grace > Heidi' | ./diagrammer force -o docs/images/layout_engines/force_2_social_mesh.png

echo 'visualizer force
Admin_Role > (User_Alice, User_Bob)
Dev_Role > (User_Bob, User_Charlie, User_David)
Auditor_Role > (User_Eve, User_Alice)
Billing_Role > (User_David, User_Eve)
Support_Role > (User_Charlie, User_Frank)' | ./diagrammer force -o docs/images/layout_engines/force_3_bipartite.png

echo 'visualizer force
ClusterA_1 > ClusterA_2 > ClusterA_3 > ClusterA_1
ClusterA_2 > ClusterA_4 > ClusterA_1
Bridge_Gateway > (ClusterA_4, ClusterB_1)
ClusterB_1 > ClusterB_2 > ClusterB_3 > ClusterB_1
ClusterB_2 > ClusterB_4 > ClusterB_1' | ./diagrammer force -o docs/images/layout_engines/force_4_clique_cluster.png

echo 'visualizer force
In_1 > (H1_A, H1_B, H1_C)
In_2 > (H1_A, H1_B, H1_C)
In_3 > (H1_A, H1_B, H1_C)
(H1_A, H1_B, H1_C) > (H2_A, H2_B)
(H2_A, H2_B) > (Out_Softmax, Out_Loss)' | ./diagrammer force -o docs/images/layout_engines/force_5_neural_net.png

# 2. Tree diagrams
./diagrammer tree tests/test_inputs/tree_dendrogram.txt -o docs/images/layout_engines/tree_1_dendrogram.png

echo 'visualizer radial
Core_Kernel > (Memory_Mgr, Process_Scheduler, VFS, Net_Stack)
Memory_Mgr > (Paging, Slab_Alloc, Swap)
Process_Scheduler > (CFS, Realtime_RT, Deadlock_Detect)
VFS > (Ext4_Driver, ZFS_Driver, NFS_Client)
Net_Stack > (TCP_Engine, UDP_Engine, IP_Router)' | ./diagrammer radial -o docs/images/layout_engines/tree_2_radial_system.png

echo 'visualizer tree
CEO > (CTO, CFO, COO)
CTO > (VP_Eng, VP_Research)
VP_Eng > (Team_Core, Team_Web)
COO > (Head_Sales, Head_Ops)' | ./diagrammer tree -o docs/images/layout_engines/tree_3_org_chart.png

echo 'visualizer tree
Root > (src, tests, docs, build)
src > (core, parser, layout)
layout > (layered, sequence, tree, grid, force)
tests > (test_inputs, parity)' | ./diagrammer tree -o docs/images/layout_engines/tree_4_file_system.png

echo 'visualizer tree
BinaryExpr_Add > (Term_Mult, Number_42)
Term_Mult > (Number_7, Variable_X)' | ./diagrammer tree -o docs/images/layout_engines/tree_5_syntax_ast.png

# 3. Grid diagrams
./diagrammer grid tests/test_inputs/network_bus.txt -o docs/images/layout_engines/grid_1_network_bus.png

echo 'visualizer grid
group VPC_Transit {
  GW_Edge#38bdf8
  NAT_Gateway#38bdf8
  VPN_Tunnel#38bdf8
}
group App_Subnet {
  API_Svc01#10b981
  API_Svc02#10b981
  Worker_Queue#10b981
}' | ./diagrammer grid -o docs/images/layout_engines/grid_2_cloud_vpc.png

echo 'visualizer grid
group Rack_42U {
  Top_Of_Rack_Switch#f59e0b
  Server_Blade_01#3b82f6
  Server_Blade_02#3b82f6
  Storage_Array#ec4899
}' | ./diagrammer grid -o docs/images/layout_engines/grid_3_rack_servers.png

echo 'visualizer grid
group Modbus_Fieldbus {
  Temp_Sensor#06b6d4
  Pressure_Gauge#06b6d4
  Flow_Meter#06b6d4
  Emergency_Valve#ef4444
}' | ./diagrammer grid -o docs/images/layout_engines/grid_4_iot_bus.png

echo 'visualizer grid
Alpha > Beta > Gamma
Beta > Delta
Delta > Epsilon > Zeta
Gamma > Eta > Theta' | ./diagrammer grid -o docs/images/layout_engines/grid_5_matrix_blocks.png

echo "Done rendering gallery images."
