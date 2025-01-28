import { j as json } from "../../../../chunks/index.js";
import { b as base } from "../../../../chunks/airtable.js";
import { r as requireAuth } from "../../../../chunks/auth.js";
async function POST({ request }) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;
    const formData = await request.json();
    console.log("Received form data:", JSON.stringify(formData, null, 2));
    const requiredFields = [
      "eventName",
      "startDate",
      "endDate",
      "accountName",
      "email",
      "phone",
      "address",
      "postalCode",
      "city",
      "country",
      "deliveryStreet",
      "deliveryPostalCode",
      "deliveryCity",
      "deliveryCountry",
      "contactPerson"
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]);
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return json({
        error: "Missing required fields",
        fields: missingFields
      }, { status: 400 });
    }
    console.log("Creating organization...");
    const organizationData = {
      "Name organization": formData.accountName,
      "Email": formData.email,
      "Address": formData.address,
      "VAT NR": formData.vatNumber,
      "Postal code": formData.postalCode,
      "City": formData.city,
      "Country": formData.country
    };
    const organizationRecord = await base.Organizations.create(organizationData);
    console.log("Organization created:", organizationRecord.id);
    console.log("Creating person...");
    const personData = {
      "Name": formData.contactPerson,
      "Mobile number": formData.phone,
      "Email": formData.email,
      "Organizations": [organizationRecord.id],
      "Type of person": "Customer employee"
    };
    const personRecord = await base.Persons.create(personData);
    console.log("Person created:", personRecord.id);
    console.log("Creating event...");
    const eventData = {
      "Event name": formData.eventName,
      "Starts at": formData.startDate,
      "Stops at": formData.endDate,
      "Languages": formData.selectedLanguages.join(", "),
      "Total Distance (km)": formData.calculatedDistance || 0,
      "Status": "concept",
      "Location": `${formData.deliveryBusinessName}, ${formData.deliveryStreet}, ${formData.deliveryPostalCode} ${formData.deliveryCity}, ${formData.deliveryCountry}`,
      "Reserved by": [organizationRecord.id],
      "Contact person": [personRecord.id]
    };
    const eventRecord = await base.Events.create(eventData);
    console.log("Event created:", eventRecord.id);
    const orderArray = [
      "reced5JPzn1NAhTpw",
      // Poem Booth 1
      "recWtYRBAWR4k7i1G"
      // Transport
    ];
    if (formData.printOption) {
      orderArray.push("recyFUdF9ocIBu22i");
    }
    if (formData.themaAdded) {
      orderArray.push("recLNDdHVMnqaNkjs");
    }
    if (formData.brandingAdded) {
      orderArray.push("recUFHJDY2tmzopCh");
    }
    if (formData.getRoastedAdded) {
      orderArray.push("rec5RFM7APWsxnNLT");
    }
    if (formData.selectedLanguages.length > 1) {
      orderArray.push("rec9c2M0Ve1WthmLY");
    }
    if (formData.keynoteAdded) {
      orderArray.push("recz95xob9UOzdd6z");
    }
    if (formData.couponCode === "EVENTPARTNER") {
      orderArray.push("recAfS1ryMLkw9FuS");
    } else if (formData.couponCode === "EVENTSPECIALIST") {
      orderArray.push("recTN1wn6SzyP8f3N");
    }
    console.log("Creating reservation...");
    const reservationData = {
      "Event name": [eventRecord.id],
      "Order": orderArray
    };
    const reservationRecord = await base.Reservations.create(reservationData);
    console.log("Reservation created:", reservationRecord.id);
    return json({
      message: "Form submitted successfully",
      organizationId: organizationRecord.id,
      personId: personRecord.id,
      eventId: eventRecord.id,
      reservationId: reservationRecord.id
    });
  } catch (error) {
    console.error("Error processing form submission:", error);
    return json({
      message: error.message || "Internal Error",
      error: error.toString()
    }, { status: 500 });
  }
}
export {
  POST
};
//# sourceMappingURL=_server.js.map
