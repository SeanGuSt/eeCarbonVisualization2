/*This handles all of the buttons*/
var myButtonMenu = $("graphViewer-grid-variables");
const header = "Button Thingies"

function create_buttons(verbose, variable, hovertext) {
    const var_count = variable.length;
    var newHTML = ``;
    for(let i = 0; i < var_count; i++){
        newHTML += `<button type = "button" id = ${variable[i]} hover-text = ${hovertext[i]}>${verbose[i]}</button>`;
    }
    newHTML += ``;
    myButtonMenu.innerHTML = newHTML;
    console.log(myButtonMenu.innerHTML);
}
/*This allows the user to select other data points to view*/