export interface Translations {
  [key: string]: {
    common: {
      add: string;
      remove: string;
    };
    languages: {
      language: {
        [key: string]: string;
      };
    };
    form: {
      title: string;
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      [key: string]: string;
    };
    errors: {
      locationError: string;
      submitError: string;
      emailError: string;
      requiredField: string;
      vatNumberError: string;
      distanceError: string;
      invalidCredentials: string;
      general: string;
      loadingEvents: string;
      updateFailed: string;
      loadingFailed: string;
      [key: string]: string;
    };
    [key: string]: any;
  };
}
