import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from "zustand/middleware";

export const statusUseStore =  createStore(((set, get) => ({
    clickEnabled: true,

    changeClickEnabled: (value) =>{
        set({
        clickEnabled: value,
    })
    console.log(get().clickEnabled);
    }
    ,
}
)
));


