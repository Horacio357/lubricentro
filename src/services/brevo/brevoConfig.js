// lib/brevoConfig.js
import { TransactionalEmailsApi} from "@getbrevo/brevo";

let apiInstance = new TransactionalEmailsApi();
apiInstance.authentications.apiKey.apiKey = process.env.BREVO_API_KEY


export default apiInstance;
