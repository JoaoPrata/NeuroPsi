const neroId = parseInt(sessionStorage.getItem("neroId"));
var patientId;
window.onload = function(){
    var patientsT = document.getElementById("patients");
    $.ajax({
        url:"/api/nero/"+neroId+"/patients",
        method:"get",
        success: function(result, status){
            var str="";
            for(p of result.patients){
                patientId=p.patientId;
                str+="<tr><td><img src='images/login pic.png'></td><td>"+p.patientId+"</td><td>"+p.name+
                "</td><td>"+p.birthdate+
                "</td><td><div class='dropdown'><button class='dropbtn'>V</button><div class='dropContent'><a onclick = 'addTest("+patientId+")' href='#'>Marcar teste</a><a href='#'>Ver resultados</a><a href='#'>Ficha</a></div></div></td></tr>"
            }
            patientsT.innerHTML = str;
        },
        error: function(){
            console.log("Error");
        }
    })
};

function addTest(patientId){
    $.ajax({
        url:"/api/patients/"+patientId+"/tests",
        method:"post",
        data: {neroId: neroId, patientId: patientId},
        success: function(data, status){
            alert("Teste marcado");
        },
        error: function(){
            console.log("Error");
        }
    })
}


