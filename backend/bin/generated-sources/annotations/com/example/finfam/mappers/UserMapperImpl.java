package com.example.finfam.mappers;

import com.example.finfam.dto.UserDTO;
import com.example.finfam.model.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-10-30T00:32:43-0300",
    comments = "version: 1.5.3.Final, compiler: Eclipse JDT (IDE) 3.44.0.v20251001-1143, environment: Java 21.0.8 (Eclipse Adoptium)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public UserDTO userToUserDTO(User user) {
        if ( user == null ) {
            return null;
        }

        UserDTO.UserDTOBuilder userDTO = UserDTO.builder();

        userDTO.email( user.getEmail() );
        userDTO.username( user.getUsername() );

        return userDTO.build();
    }

    @Override
    public User userDTOToUser(UserDTO userDTO) {
        if ( userDTO == null ) {
            return null;
        }

        User.UserBuilder user = User.builder();

        user.email( userDTO.getEmail() );
        user.username( userDTO.getUsername() );

        return user.build();
    }
}
