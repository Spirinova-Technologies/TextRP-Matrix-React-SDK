import SdkConfig from "./SdkConfig";
import UserIdentifierCustomisations from "./customisations/UserIdentifier";
import { MatrixClientPeg } from "./MatrixClientPeg";
import axios from "axios";
const getAllEnabledNfts = async () => {
    try {
        const details = UserIdentifierCustomisations.getDisplayUserIdentifier(
            MatrixClientPeg.get().getSafeUserId(),
            {
                withDisplayName: true,
            },
        );
        const { data: userData } = await axios.post(`${SdkConfig.get("backend_url")}/my-address`, {
            address: details,
        });
        const { data: enableFeatures } = await axios.get(
            `${SdkConfig.get("backend_url")}/my-features/${userData.address}/main/enabled`,
        );
        return enableFeatures;
    } catch (e) {
        console.error(e);
    }
    return {};
}
export const getAllFeatures = async ():Promise<any> =>{
   try{
    const features = await axios.get(`${SdkConfig.get('backend_url')}/always-enabled-feature`);
    return features;
   }  catch (e) {
    console.error(e);
   }
   return {};
}
export const isComponentEnabled = async(title:string)=>{
    try{
        const userNfts = await getAllEnabledNfts();
        const { data } = await getAllFeatures();        
        let userHaveNft = false;
        let adminEnable = false;
        if (userNfts["nfts"]) {
            userNfts["nfts"].forEach((nft)=>{
                if(nft.feature.includes(title)){
                    userHaveNft = true;
                }
            })
        }
        if (data.length > 0) {
            data.forEach((feature)=>{
                if(feature.feature ===title){
                    adminEnable = true;
                }
            })
        }        
        return userHaveNft || adminEnable;
    }catch(e){
        console.error(e);
    }
    return false;
}
export default getAllEnabledNfts;
