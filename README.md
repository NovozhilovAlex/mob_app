# BBR

Проект приложения Банкноты Банка России на платформе ReactNative!


Для обновления координат в БД:

update sign
set
show_x = (sign_min_x  + sign_max_x)/2,
show_y = (sign_min_y  + sign_max_y)/2
where sign_type_id in (1, 2, 3)


update sign
set
show_x = (select pivot_y from sign_res sr where sr.sign_res_id = sign_res1),
show_y = (select pivot_x from sign_res sr where sr.sign_res_id = sign_res1)
where sign_type_id in (4)
