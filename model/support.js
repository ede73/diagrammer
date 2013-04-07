function debug(msg){
	if (VERBOSE==true)
		console.log(msg);
} 
function setAttr(cl,attr,value){
        cl[attr]=value;
        return cl;
}
String.prototype.format = function() {
        var formatted = this;
        for (arg in arguments) {
            formatted = formatted.replace("{" + arg + "}", arguments[arg]);
        }
        return formatted;
};
/* return attribute like prefix="ATTRHERE" with padding at both sides or "" if 0 or undefined */
function getAttr(cl,attr){
        if (cl[attr]==undefined || cl[attr]==0)return "";
        return cl[attr];
}
function getAttrFmt(cl,attr,fmt){
	if (cl[attr]==undefined || cl[attr]==0)return "";
	return ' '+fmt.format(cl[attr])+' ';
}