const API_URL = "http://https://smart-health-and-kitchen-assistant.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

    const userId = localStorage.getItem("user_id");

    if (!userId) {
        window.location.href = "login.html";
    }

});

window.addEventListener("DOMContentLoaded", () => {
    loadKitchenData();
    loadMedicineData();
});

// ---------------------
// Kitchen Dashboard
// ---------------------

async function loadKitchenData() {
    try {
        const userId = localStorage.getItem("user_id");

        const response = await fetch(
            `${API_URL}/items?user_id=${userId}`
        );
        const items = await response.json();

        document.getElementById("kit-total").textContent = items.length;

        let expiring = 0;
        let expired = 0;
        let lowStock = 0;
        let critical = 0;

        const preview = document.getElementById("kitchen-preview");
        preview.innerHTML = "";

        items.forEach(item => {

            const qty = Number(item.quantity);

            if (qty <= 2)
                lowStock++;

            const today = new Date();
            today.setHours(0,0,0,0);

            const expiry = new Date(item.expiryDate);
            expiry.setHours(0,0,0,0);

            const daysLeft = Math.ceil((expiry - today)/(1000*60*60*24));

            let status = "";

            if(daysLeft < 0){
                expired++;
                critical++;
                status = "Expired";
            }
            else if(daysLeft <=2){
                critical++;
                status = `${daysLeft} day(s) left`;
            }
            else if(daysLeft <=7){
                expiring++;
                status = `${daysLeft} day(s) left`;
            }
            else{
                status = "Fresh";
            }

            if(preview.children.length < 5){

                preview.innerHTML += `
                <li class="preview-item">
                    <span>${item.name}</span>
                    <span>${status}</span>
                </li>`;
            }

        });

        document.getElementById("kit-expiring").textContent = expiring;
        document.getElementById("kit-expired").textContent = expired;

        updateGlobalCounts(lowStock,critical);

    } catch(err){
        console.error(err);
    }
}



// ---------------------
// Medicine Dashboard
// ---------------------

async function loadMedicineData(){

    try{

        const userId = localStorage.getItem("user_id");

        const response = await fetch(
            `${API_URL}/medicines?user_id=${userId}`
        );
        const medicines = await response.json();

        document.getElementById("med-total-skus").textContent = medicines.length;

        let lowStock=0;
        let critical=0;

        const preview=document.getElementById("medicine-preview");
        preview.innerHTML="";

        medicines.forEach(medicine=>{

            const qty=Number(medicine.quantity);

            if(qty<=2)
                lowStock++;

            const today=new Date();
            today.setHours(0,0,0,0);

            const expiry=new Date(medicine.expiryDate);
            expiry.setHours(0,0,0,0);

            const daysLeft=Math.ceil((expiry-today)/(1000*60*60*24));

            let status="Safe";

            if(daysLeft<=2){
                critical++;
                status=`${daysLeft} day(s) left`;
            }

            if(preview.children.length<5){

                preview.innerHTML+=`
                <li class="preview-item">
                    <span>${medicine.medicineName}</span>
                    <span>${status}</span>
                </li>`;
            }

        });

        document.getElementById("med-low-stock").textContent=lowStock;
        document.getElementById("med-critical").textContent=critical;

        updateGlobalCounts(lowStock,critical);

    }
    catch(err){
        console.error(err);
    }

}



// ---------------------
// Combined Alerts
// ---------------------

let kitchenLow=0;
let kitchenCritical=0;

let medicineLow=0;
let medicineCritical=0;

function updateGlobalCounts(low,critical){

    if(kitchenLow===0 && kitchenCritical===0){

        kitchenLow=low;
        kitchenCritical=critical;

    }else{

        medicineLow=low;
        medicineCritical=critical;

    }

    document.getElementById("total-low-stock-count").textContent=
        kitchenLow+medicineLow;

    document.getElementById("total-critical-count").textContent=
        kitchenCritical+medicineCritical;
}

document.getElementById("addMedicineBtn").addEventListener("click", () => {
    window.location.href = "additemmed.html";
});