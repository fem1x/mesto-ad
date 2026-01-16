import { createCardElement, likeCard, removeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import { getUserInfo, getCardList, setUserInfo, setUserAvatar, addCard, deleteCard, changeLikeCardStatus} from "./components/api.js";

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};
enableValidation(validationSettings); 

//DOM элементы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const deleteCardModalWindow = document.querySelector(".popup_type_remove-card");
const deleteCardForm = deleteCardModalWindow.querySelector(".popup__form");

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoModalTitle = cardInfoModalWindow.querySelector(".popup__title");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoModalUsersList = cardInfoModalWindow.querySelector(".popup__list");
const cardInfoModalText = cardInfoModalWindow.querySelector(".popup__text");

let currentUserId = '';

const setButtonLoading = (buttonElement, isLoading) => {
  if (isLoading) {
    buttonElement.dataset.originalText = buttonElement.textContent.trim(); //data-original-text
    const originalText = buttonElement.dataset.originalText;
    
    if (originalText === 'Сохранить') {
    buttonElement.textContent = 'Сохранение...';
    } else if (originalText === 'Создать') {
        buttonElement.textContent = 'Создание...';
    } else if (originalText === 'Да') {
        buttonElement.textContent = 'Удаление...';
    } else {
        buttonElement.textContent = 'Загрузка...';
    }

    buttonElement.dataset.wasDisabled = buttonElement.disabled; //data-was-disabled
    buttonElement.disabled = true;
  } else {
    if (buttonElement.dataset.originalText) {
      buttonElement.textContent = buttonElement.dataset.originalText;
    }
    
    if (buttonElement.dataset.wasDisabled !== undefined) {
      buttonElement.disabled = buttonElement.dataset.wasDisabled === 'true';
    }
    
    delete buttonElement.dataset.originalText;
    delete buttonElement.dataset.wasDisabled;
  }
};

//ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ
let cardToDeleteId = '';
let cardToDeleteElement = null;

const openDeleteCardModal = (cardId, cardElement) => {
  cardToDeleteId = cardId;
  cardToDeleteElement = cardElement;
  openModalWindow(deleteCardModalWindow);
};

const handleDeleteCardSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = deleteCardForm.querySelector(".popup__button");  
  setButtonLoading(submitButton, true);
  
  if (cardToDeleteId && cardToDeleteElement) {
    deleteCard(cardToDeleteId) //api
      .then(() => {
        removeCard(cardToDeleteElement);
        closeModalWindow(deleteCardModalWindow);
        cardToDeleteId = '';
        cardToDeleteElement = null;
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setButtonLoading(submitButton, false);
      });
  }
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = profileForm.querySelector(".popup__button");  
  setButtonLoading(submitButton, true);
  
  setUserInfo({ //api
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setButtonLoading(submitButton, false);
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = avatarForm.querySelector(".popup__button");  
  setButtonLoading(submitButton, true);

  setUserAvatar(avatarInput.value) //api
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setButtonLoading(submitButton, false);
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = cardForm.querySelector(".popup__button");  
  setButtonLoading(submitButton, true);
  
  addCard({ //api
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      const cardElement = createCardElement(cardData, {
        onPreviewPicture: handlePreviewPicture,
        onLikeIcon: (likeButton, likeCountElement) => {
          handleCardLike(cardData._id, likeButton, likeCountElement);
        },

        onDeleteCard: (cardElement, cardId) => {
          openDeleteCardModal(cardId, cardElement);
        },

        onInfoClick: () => {
          handleInfoClick(cardData._id);
        },
        currentUserId: currentUserId
      });
      placesWrap.prepend(cardElement);
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      setButtonLoading(submitButton, false);
    });
};

const handleCardLike = (cardId, likeButton, likeCountElement) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");
  
  changeLikeCardStatus(cardId, isLiked) //api
    .then((updatedCard) => {
      likeCard(likeButton);
      likeCountElement.textContent = updatedCard.likes.length;
    })
    .catch((err) => {
      console.log(err);
    });
};


//EVENT LISTENERS
//отправка форм
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);
deleteCardForm.addEventListener("submit", handleDeleteCardSubmit);
//открытие форм
openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});
profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});
openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});
//закрытие попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});


//СТАТИСТИКА
const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

//строка по шаблону
const createInfoString = (term, description) => {
  const template = document.getElementById("popup-info-definition-template");
  const infoItem = template.content.cloneNode(true);
  
  infoItem.querySelector(".popup__info-term").textContent = term;
  infoItem.querySelector(".popup__info-description").textContent = description;
  
  return infoItem;
};

const handleInfoClick = (cardId) => {
  getCardList() //api
    .then((cards) => {
      const cardData = cards.find(card => card._id === cardId); //поиск по id
      
      if (!cardData) {
        console.error("Карточка не найдена");
        return;
      }

      cardInfoModalTitle.textContent = "Информация о карточке";
      //очистка старых данных
      cardInfoModalInfoList.innerHTML = "";
      cardInfoModalUsersList.innerHTML = "";
      
      //InfoList
      cardInfoModalInfoList.append(
        createInfoString(
          "Описание:",
          cardData.name
        )
      );
      cardInfoModalInfoList.append(
        createInfoString(
          "Дата создания:",
          formatDate(new Date(cardData.createdAt))
        )
      );
      cardInfoModalInfoList.append(
        createInfoString(
          "Владелец:",
          cardData.owner.name
        )
      );
      cardInfoModalInfoList.append(
        createInfoString(
          "Количество лайков:",
          cardData.likes.length.toString()
        )
      );
    
      cardInfoModalText.textContent = "Лайкнули:";
      //UsersList
      if (cardData.likes.length > 0) {
        cardData.likes.forEach(user => {
          cardInfoModalUsersList.append(
            createInfoString(
              user.name,
              ""
            )
          );
        });
      }

      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};


Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id; 

    //данные профиля
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    
    //отрисовка карточек
    cards.forEach((cardData) => {
      placesWrap.append(
        createCardElement(cardData, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: (likeButton, likeCountElement) => {
            handleCardLike(cardData._id, likeButton, likeCountElement);
          },

          onDeleteCard: (cardElement, cardId) => {
            openDeleteCardModal(cardId, cardElement);
          },
          
          onInfoClick: () => {
            handleInfoClick(cardData._id);
          },
          currentUserId: currentUserId
        })
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });