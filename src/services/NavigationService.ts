import {useNavigation, useRouter, useSegments} from "expo-router";
import {useCameraPermission} from "react-native-vision-camera";

export const useNavigationService = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const segments = useSegments(); // ['(drawer)', 'home']
  const { hasPermission: cameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();

  const isPossibleDismissAllInStack = (newStackName: string, newPageName: string): boolean => {
    // const newStackName = '(info-stack)';
    // const newPageName = 'info';

    console.log('===isPossibleDismissAllInStack===');
    console.log('newStackName: ', newStackName);
    console.log('newPageName: ', newPageName);


    // Получаем текущей выбранный Stack
    if (!segments ||
      segments.length <= 0)
    {
      console.log('segments not valid ');
      return false;
    }
    console.log('segments: ', segments);

    const currentStack = segments.at(0);
    console.log('currentStack: ', currentStack);

    // Ищем корневую навигацию
    let rootNavigation = navigation;
    let i = 0;
    while (rootNavigation.getParent() && i < 10) {
      rootNavigation = rootNavigation.getParent()!;
      i++;
    }
    if (i >= 10)
    {
      console.log('isPossibleDismissAllInStack i>10! ');
      return false;
    }
    console.log(`rootNavigation: ${rootNavigation} (i=${i})`);

    const rootNavigationState = rootNavigation.getState();
    if (!rootNavigationState){
      console.log('rootNavigationState not valid ');
      return false;
    }

    console.log(`rootNavigation routes: ${rootNavigationState.routes.map(r => r.name)}`);

    // Берем корневой элемент
    const root = rootNavigationState.routes.find(r => r.name == '__root');

    if (!root ||
        !root.state){
      console.log('root not valid ');
      return false;
    }

    console.log(`root: ${root}`);

    // Получаем информацию о стэке куда хотим перейти
    const newStack =
      root.state.routes.find(r => r.name === newStackName);

    if (!newStack ||
        !newStack.state ||
        newStack.state.routes.length <= 0)
    {
      console.log('newStack not valid ');
      return false;
    }
    console.log(`newStack: ${newStack}`);

    const newStackRoutes = newStack.state.routes;

    console.log('newStackRoutes:', newStackRoutes.map(r => r.name));

    // Если переход идет внутри одного стека
    if (currentStack === newStackName){
      // Проверяем есть ли еще страницы в этом стеке
      if (newStackRoutes.length > 0)
      {
        console.log('currentStack === newStackName AND newStackRoutes.length > 0 => true');
        // Если есть - то очищаем
        return true;
      }
      else
      {
        console.log('currentStack === newStackName AND !(newStackRoutes.length > 0) => false');
        return false;
      }
    }
    else
    {
      // Если переходим из другого стека
      if (newStackRoutes.length <= 0)
      {
        console.log('!(currentStack === newStackName) AND newStackRoutes.length <= 0 => false');

        return false;
      }
      else
      {
        // Если есть ранее открытые страницы и мы уже находимся на нужной нам, то очищать стек не нужно
        const lastNewStackPage = newStackRoutes.at(newStackRoutes.length - 1);
        if (!lastNewStackPage)
        {
          console.log('!(currentStack === newStackName) AND !lastNewStackPage => false');

          return false;
        }
        console.log(`lastNewStackPage: ${lastNewStackPage.name}`);

        if (lastNewStackPage.name === newPageName) {
          console.log('!(currentStack === newStackName) AND lastNewStackPage.name === newPageName => false');

          return false;
        }
        else
        {
          console.log('!(currentStack === newStackName) AND !(lastNewStackPage.name === newPageName) => true');

          return true;
        }
      }
    }
  };

  const openMainPage = () => {
    router.push("../(main-stack)");
    const isNeedDismissAll = isPossibleDismissAllInStack('(main-stack)', 'index');
    console.log(`isNeedDismissAll: ${isNeedDismissAll}`);

    if (isNeedDismissAll) {
      router.dismissAll();
    }
  };

  const openCameraPage = async () => {
    if (!cameraPermission) {
      const result = await requestCameraPermission();
      if (!result) {
        console.log("Camera permission denied");
        return;
      }
    }

    router.push("../(camera-stack)/camera");
    const isNeedDismissAll = isPossibleDismissAllInStack('(camera-stack)', 'camera');
    console.log(`isNeedDismissAll: ${isNeedDismissAll}`);

    if (isNeedDismissAll) {
      router.dismissAll();
    }
  };

  const openInfoPage = () => {
    router.push("../(info-stack)/info");
    const isNeedDismissAll = isPossibleDismissAllInStack('(info-stack)', 'info');
    console.log(`isNeedDismissAll: ${isNeedDismissAll}`);

    if (isNeedDismissAll) {
      router.dismissAll();
    }
  };

  const openSettingsPage = () => {
    router.push("../(settings-stack)/settings");
    const isNeedDismissAll = isPossibleDismissAllInStack('(settings-stack)', 'settings');
    console.log(`isNeedDismissAll: ${isNeedDismissAll}`);

    if (isNeedDismissAll) {
      router.dismissAll();
    }
  };

  const openModificationPage = (modificationId: any, side?: any) => {
    router.push({
        pathname: "../(main-stack)/modification",
        params: {
          modificationId: modificationId,
          side: side ?? "1",
        }
    });

    const isNeedDismissAll = isPossibleDismissAllInStack('(main-stack)', 'modification');
    console.log(`isNeedDismissAll: ${isNeedDismissAll}`);

    if (isNeedDismissAll) {
      router.dismissAll();
    }
  };

  return { openMainPage, openCameraPage, openInfoPage, openSettingsPage, openModificationPage };
};

