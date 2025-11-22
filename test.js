const containe_div=document.getElementsByClassName("continer");
const   des_etem=document.getElementsByClassName("desitems");
let items=document.querySelectorAll(".desitems div");
let drag_able=null;
items.forEach(item=>{
item.addEventListener("dragstart",e=>{
drag_able=e.target;
e.dataTransfer.setData("it",e.target.id);
});
});
containe_div[0].addEventListener("dragover",e=>{
e.preventDefault();

});
 containe_div[0].addEventListener("drop",e=>{
    
    containe_div[0].appendChild(drag_able);
     console.log(e.dataTransfer.getData("it"));
 });
